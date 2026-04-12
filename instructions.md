# How to Run This Project in VS Code

This project is fully designed and configured to run natively inside Visual Studio Code across all operating systems (macOS, Linux, and Windows) with zero hassle.

### Prerequisites
- Python (3.9+)
- Node.js
- Visual Studio Code

---

## ⭐ Option 1: The Easy Way (VS Code Tasks)

We have configured a one-click automated task that will set up your environment, and automatically start both the backend and frontend in split terminal windows right here in VS Code!

1. Open the VS Code Command Palette:
   - **Mac:** <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd>
   - **Windows / Linux:** <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd>
2. Type **"Tasks: Run Task"** and press <kbd>Enter</kbd>.
3. Select **"Run Project (Split Terminals)"**.

> **That's it!** VS Code will automatically start FastAPI in one pane and Next.js in the other.
> To stop them, just click the trash can icon in the terminal panes.

---

## 💻 Option 2: Using the Integrated Terminal

If you prefer running scripts manually using the VS Code Integrated Terminal (<kbd>Ctrl</kbd> + <kbd>`</kbd> or <kbd>Cmd</kbd> + <kbd>`</kbd>), we provide two helper scripts:

- `setup.sh`: Installs dependencies *(Run ONLY the first time you clone the repo)*.
- `start.sh`: Starts both servers in the background.

### For macOS / Linux

1. Open a new Integrated Terminal in VS Code.
2. Give execution permissions *(first time only)*:
   ```bash
   chmod +x setup.sh start.sh