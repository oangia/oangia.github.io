import gspread
import pandas as pd

sheet_id = "1E7wql56jakoZK-6aCbSF6By4_DO1evYspx_uzSgom94"
sheet_name = "Sheet8"

csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet={sheet_name}"

df = pd.read_csv(csv_url)

# Read column A from row 2 onward
column_data = df.iloc[1:, 0].tolist()
for text in column_data:
    if text.lower().find("how") == 0:
        print(text)
