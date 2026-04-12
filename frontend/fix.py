with open("pages/index.tsx", "r") as f:
    text = f.read()
text = text.replace('join("\n")', 'join("\\n")')
with open("pages/index.tsx", "w") as f:
    f.write(text)
