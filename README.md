# MCC PDF Parser

Extracts MCC codes from PDFs using Camelot. Handles large files (1000+ pages) with auto-detection.

## Setup

```bash
npm install
pip3 install camelot-py pypdf
```

## Usage

```bash
# Extract entire PDF
npm start path/to/file.pdf

# Specific pages
npm start file.pdf --start-page 30 --end-page 50

# From page X to end
npm start file.pdf --start-page 100

# Custom output
npm start file.pdf -o output.json
```

## Output

- **JSON**: `{"1520": "General Contractors", "3799": "HOTEL NAME"}`
- **Logs**: `output-filename-logs.txt`

## Test

```bash
npm test
```

## Config

Adjust minimum description length in `parse-mcc-pdf.py`:

```python
MIN_DESCRIPTION_LENGTH = 2
```
