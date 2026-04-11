from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import date, timedelta
from typing import List

import numpy as np
import pandas as pd


@dataclass
class StoryConfig:
    march_revenue_dip_pct: float = 0.23
    march_card_failure_rate: float = 0.08
    march_south_volume_drop_pct: float = 0.40
    q2_complaints_multiplier: float = 3.0
    week8_digital_drop_pct: float = 0.55
    week8_branch_uplift_pct: float = 0.25


def _date_range(start: date, end: date) -> List[date]:
    days = (end - start).days + 1
    return [start + timedelta(days=offset) for offset in range(days)]


def _week_of_year(day: date) -> int:
    return int(day.isocalendar().week)


def _quarter(month: int) -> int:
    return (month - 1) // 3 + 1


def _weighted_choice(rng: np.random.Generator, options: List[str], weights: List[float], size: int) -> List[str]:
    return rng.choice(options, p=np.array(weights) / np.sum(weights), size=size).tolist()


def generate_customers(rng: np.random.Generator, count: int) -> pd.DataFrame:
    customer_ids = [f"C{100000 + idx}" for idx in range(count)]
    segments = ["18-25", "26-40", "41-55", "56+"]
    regions = ["North", "South", "East", "West"]
    primary_channels = ["Digital", "Branch", "ATM", "CallCenter"]

    segment = _weighted_choice(rng, segments, [0.22, 0.38, 0.25, 0.15], count)
    region = _weighted_choice(rng, regions, [0.18, 0.45, 0.19, 0.18], count)
    primary_channel = _weighted_choice(rng, primary_channels, [0.5, 0.25, 0.15, 0.1], count)
    join_dates = rng.choice(pd.date_range("2020-01-01", "2023-12-31"), size=count)

    return pd.DataFrame({
        "customer_id": customer_ids,
        "segment": segment,
        "age_band": segment,
        "region": region,
        "join_date": pd.to_datetime(join_dates).date,
        "primary_channel": primary_channel,
    })


def generate_transactions(
    rng: np.random.Generator,
    customers: pd.DataFrame,
    count: int,
    story: StoryConfig,
) -> pd.DataFrame:
    customer_ids = customers["customer_id"].tolist()
    regions = ["North", "South", "East", "West"]
    product_types = ["Card", "Loan", "Savings", "Insurance"]
    channels = ["Digital", "Branch", "ATM", "CallCenter"]
    failure_reasons = ["CardFailure", "AppLoginError", "NetworkOutage"]

    dates = rng.choice(pd.date_range("2024-01-01", "2024-12-31"), size=count)
    dates = pd.to_datetime(dates).date

    base_region = _weighted_choice(rng, regions, [0.18, 0.45, 0.19, 0.18], count)
    base_channel = _weighted_choice(rng, channels, [0.55, 0.23, 0.14, 0.08], count)
    base_product = _weighted_choice(rng, product_types, [0.7, 0.12, 0.12, 0.06], count)

    amounts = rng.normal(120, 35, size=count).clip(5, 600)
    status = np.array(["Success"] * count)
    failure_reason = np.array(["None"] * count)

    transaction_ids = [f"T{1000000 + idx}" for idx in range(count)]
    customer_id = rng.choice(customer_ids, size=count).tolist()

    rows = []
    for idx in range(count):
        row_date = dates[idx]
        month = row_date.month
        week = _week_of_year(row_date)

        region = base_region[idx]
        channel = base_channel[idx]
        product = base_product[idx]
        amount = float(amounts[idx])

        rows.append({
            "date": row_date.isoformat(),
            "transaction_id": transaction_ids[idx],
            "customer_id": customer_id[idx],
            "region": region,
            "product_type": product,
            "channel": channel,
            "amount": round(amount, 2),
            "status": status[idx],
            "failure_reason": failure_reason[idx],
            "week_of_year": week,
            "month": month,
            "quarter": _quarter(month),
        })

    df = pd.DataFrame(rows)

    march_mask = df["month"] == 3
    south_march_mask = march_mask & (df["region"] == "South")
    south_drop = df[south_march_mask].sample(
        frac=story.march_south_volume_drop_pct, random_state=42
    ).index
    df = df.drop(index=south_drop)
    march_mask = df["month"] == 3
    south_march_mask = march_mask & (df["region"] == "South")
    df.loc[south_march_mask, "amount"] *= 0.6

    march_card_mask = march_mask & (df["product_type"] == "Card")
    card_failures = df[march_card_mask].sample(
        frac=story.march_card_failure_rate, random_state=43
    ).index
    df.loc[card_failures, "status"] = "Failed"
    df.loc[card_failures, "failure_reason"] = "CardFailure"

    week8_digital_mask = (df["week_of_year"] == 8) & (df["channel"] == "Digital")
    digital_drop = df[week8_digital_mask].sample(
        frac=story.week8_digital_drop_pct, random_state=44
    ).index
    df = df.drop(index=digital_drop)

    branch_uplift_mask = df["channel"].eq("Branch") & df["week_of_year"].isin([8, 9])
    branch_rows = df[branch_uplift_mask]
    uplift_count = int(len(branch_rows) * story.week8_branch_uplift_pct)
    if uplift_count > 0:
        uplift_samples = branch_rows.sample(n=uplift_count, random_state=45).copy()
        next_id = int(df["transaction_id"].str[1:].astype(int).max()) + 1
        uplift_samples["transaction_id"] = [f"T{next_id + i}" for i in range(uplift_count)]
        df = pd.concat([df, uplift_samples], ignore_index=True)

    df.loc[:, "amount"] = df["amount"].round(2)
    df.reset_index(drop=True, inplace=True)
    return df


def generate_complaints(
    rng: np.random.Generator,
    customers: pd.DataFrame,
    count: int,
    story: StoryConfig,
) -> pd.DataFrame:
    categories = ["Login", "Card", "Fees", "Service"]
    channels = ["Digital", "Branch", "CallCenter"]

    customer_ids = customers["customer_id"].tolist()
    dates = rng.choice(pd.date_range("2024-01-01", "2024-12-31"), size=count)
    dates = pd.to_datetime(dates).date
    customer_sample = rng.choice(customer_ids, size=count).tolist()

    complaints = []
    for idx in range(count):
        row_date = dates[idx]
        month = row_date.month
        quarter = _quarter(month)
        customer_id = customer_sample[idx]
        customer = customers[customers["customer_id"] == customer_id].iloc[0]

        category = rng.choice(categories, p=[0.35, 0.25, 0.2, 0.2])
        channel = rng.choice(channels, p=[0.55, 0.25, 0.2])

        complaints.append({
            "date": row_date.isoformat(),
            "complaint_id": f"CP{200000 + idx}",
            "customer_id": customer_id,
            "region": customer["region"],
            "category": category,
            "channel": channel,
            "volume": 1,
            "segment": customer["segment"],
            "week_of_year": _week_of_year(row_date),
            "month": month,
            "quarter": quarter,
        })

    df = pd.DataFrame(complaints)
    q1_volume = df[df["quarter"] == 1]["volume"].sum()
    q2_volume = df[df["quarter"] == 2]["volume"].sum()
    target_q2 = int(q1_volume * story.q2_complaints_multiplier)
    extra_needed = max(target_q2 - q2_volume, 0)

    if extra_needed > 0:
        q2_dates = pd.date_range("2024-04-01", "2024-06-30")
        segment_customers = customers[customers["segment"] == "18-25"]
        sampled_customers = segment_customers.sample(
            n=extra_needed, replace=True, random_state=46
        )
        extra_rows = []
        start_id = int(df["complaint_id"].str[2:].astype(int).max()) + 1
        for idx in range(extra_needed):
            customer = sampled_customers.iloc[idx]
            row_date = pd.to_datetime(rng.choice(q2_dates)).date()
            extra_rows.append({
                "date": row_date.isoformat(),
                "complaint_id": f"CP{start_id + idx}",
                "customer_id": customer["customer_id"],
                "region": customer["region"],
                "category": "Login",
                "channel": "Digital",
                "volume": 1,
                "segment": customer["segment"],
                "week_of_year": _week_of_year(row_date),
                "month": row_date.month,
                "quarter": _quarter(row_date.month),
            })

        df = pd.concat([df, pd.DataFrame(extra_rows)], ignore_index=True)

    df.reset_index(drop=True, inplace=True)
    return df


def generate_support_tickets(
    rng: np.random.Generator,
    customers: pd.DataFrame,
    count: int,
) -> pd.DataFrame:
    ticket_types = ["Login", "Card", "Transfer", "AppBug", "Other"]
    channels = ["Digital", "CallCenter", "Branch"]

    customer_ids = customers["customer_id"].tolist()
    dates = rng.choice(pd.date_range("2024-01-01", "2024-12-31"), size=count)
    dates = pd.to_datetime(dates).date
    customer_sample = rng.choice(customer_ids, size=count).tolist()

    tickets = []
    for idx in range(count):
        row_date = dates[idx]
        customer_id = customer_sample[idx]
        customer = customers[customers["customer_id"] == customer_id].iloc[0]

        resolution = float(rng.normal(12, 6))
        resolution = max(1.0, min(resolution, 72.0))

        tickets.append({
            "date": row_date.isoformat(),
            "ticket_id": f"TK{500000 + idx}",
            "customer_id": customer_id,
            "region": customer["region"],
            "type": rng.choice(ticket_types, p=[0.25, 0.25, 0.2, 0.2, 0.1]),
            "resolution_time_hours": round(resolution, 2),
            "channel": rng.choice(channels, p=[0.5, 0.35, 0.15]),
            "segment": customer["segment"],
            "week_of_year": _week_of_year(row_date),
            "month": row_date.month,
            "quarter": _quarter(row_date.month),
        })

    return pd.DataFrame(tickets)


def main() -> None:
    rng = np.random.default_rng(42)
    story = StoryConfig()

    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    data_dir = os.path.join(repo_root, "data")
    os.makedirs(data_dir, exist_ok=True)

    customers = generate_customers(rng, 8000)
    customers.to_csv(os.path.join(data_dir, "customers.csv"), index=False)

    transactions = generate_transactions(rng, customers, 60000, story)
    transactions.to_csv(os.path.join(data_dir, "transactions.csv"), index=False)

    complaints = generate_complaints(rng, customers, 2000, story)
    complaints.to_csv(os.path.join(data_dir, "complaints.csv"), index=False)

    tickets = generate_support_tickets(rng, customers, 4000)
    tickets.to_csv(os.path.join(data_dir, "support_tickets.csv"), index=False)

    print("Dataset generated in", data_dir)


if __name__ == "__main__":
    main()
