from __future__ import annotations

import os
from typing import Dict

import pandas as pd


REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA_DIR = os.path.join(REPO_ROOT, "data")
OUTPUT_DIR = os.path.join(REPO_ROOT, "docs", "validation")


def _load_csv(name: str) -> pd.DataFrame:
    path = os.path.join(DATA_DIR, f"{name}.csv")
    return pd.read_csv(path)


def _save_csv(df: pd.DataFrame, filename: str) -> str:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    path = os.path.join(OUTPUT_DIR, filename)
    df.to_csv(path, index=False)
    return path


def revenue_by_month(transactions: pd.DataFrame) -> str:
    tx = transactions.copy()
    tx = tx[tx["status"] == "Success"]
    monthly = tx.groupby("month")["amount"].sum().reset_index()
    return _save_csv(monthly, "story1_monthly_revenue.csv")


def complaints_by_quarter(complaints: pd.DataFrame) -> str:
    quarterly = complaints.groupby("quarter")["volume"].sum().reset_index()
    return _save_csv(quarterly, "story2_complaints_q2.csv")


def channel_by_week(transactions: pd.DataFrame) -> str:
    weekly = transactions.groupby(["week_of_year", "channel"]).size().reset_index(name="count")
    return _save_csv(weekly, "story3_week8_channel_drop.csv")


def story_metrics(transactions: pd.DataFrame, complaints: pd.DataFrame) -> Dict[str, float]:
    tx = transactions.copy()
    tx_success = tx[tx["status"] == "Success"]

    revenue_by_month_df = tx_success.groupby("month")["amount"].sum()
    march_revenue = float(revenue_by_month_df.loc[3])
    feb_revenue = float(revenue_by_month_df.loc[2])
    dip_pct = (feb_revenue - march_revenue) / feb_revenue

    march_tx = tx[tx["month"] == 3]
    card_failed = march_tx[(march_tx["product_type"] == "Card") & (march_tx["status"] == "Failed")]
    card_total = march_tx[march_tx["product_type"] == "Card"]
    card_failure_rate = len(card_failed) / max(len(card_total), 1)

    q2_complaints = complaints[complaints["quarter"] == 2]["volume"].sum()
    q1_complaints = complaints[complaints["quarter"] == 1]["volume"].sum()
    q2_multiplier = q2_complaints / max(q1_complaints, 1)

    digital_week8 = tx[tx["week_of_year"] == 8]
    digital_week7 = tx[tx["week_of_year"] == 7]
    digital_drop = 1 - (
        len(digital_week8[digital_week8["channel"] == "Digital"])
        / max(len(digital_week7[digital_week7["channel"] == "Digital"]), 1)
    )

    return {
        "march_revenue_dip_pct": dip_pct,
        "march_card_failure_rate": card_failure_rate,
        "q2_complaints_multiplier": q2_multiplier,
        "week8_digital_drop_pct": digital_drop,
    }


def main() -> None:
    transactions = _load_csv("transactions")
    complaints = _load_csv("complaints")

    paths = [
        revenue_by_month(transactions),
        complaints_by_quarter(complaints),
        channel_by_week(transactions),
    ]

    metrics = story_metrics(transactions, complaints)

    print("Chart data saved:")
    for path in paths:
        print("-", path)

    print("\nStory metrics:")
    for key, value in metrics.items():
        print(f"- {key}: {value:.3f}")


if __name__ == "__main__":
    main()
