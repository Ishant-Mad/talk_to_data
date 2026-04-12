with open("frontend/pages/index.tsx", "r") as f:
    text = f.read()

text = text.replace("type ChartPayload = ChartPlanItem[\"chart\"];", "")

text = text.replace("type ChatResponse", "type ChartPayload = ChartPlanItem[\"chart\"];\n\n  type ChatResponse")

with open("frontend/pages/index.tsx", "w") as f:
    f.write(text)
