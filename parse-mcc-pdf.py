#!/usr/bin/env python3
"""
Extract MCC table data from PDF using Camelot
"""

import camelot
import sys
import json
import os
import re
from pypdf import PdfReader

# Configuration constants
MIN_DESCRIPTION_LENGTH = 2

def get_pdf_page_count(pdf_path):
    """Get the total number of pages in a PDF"""
    try:
        reader = PdfReader(pdf_path)
        return len(reader.pages)
    except Exception as e:
        print(f"Error reading PDF page count: {e}")
        return None

def extract_mcc_with_camelot(pdf_path, start_page=None, end_page=None, method='lattice'):
    """Extract MCC table from PDF pages using Camelot"""
    
    try:
        # Auto-detect page range if not specified
        if start_page is None or end_page is None:
            page_count = get_pdf_page_count(pdf_path)
            if page_count is None:
                print("Could not determine PDF page count, defaulting to single page")
                start_page = start_page or 1
                end_page = end_page or 1
            else:
                start_page = start_page or 1
                end_page = end_page or page_count
                print(f"Auto-detected PDF has {page_count} pages")
        
        print(f"Extracting MCC tables from pages {start_page}-{end_page}...")
        print(f"Using Camelot with {method} method...")
        print()
        
        all_mcc_data = {}
        successful_pages = []
        failed_pages = []
        
        # Try to extract from each page individually to handle errors gracefully
        for page_num in range(start_page, end_page + 1):
            print(f"📄 Processing page {page_num}...", end=" ", flush=True)
            
            try:
                if method == 'lattice':
                    tables = camelot.read_pdf(pdf_path, pages=str(page_num), flavor='lattice')
                else:
                    tables = camelot.read_pdf(pdf_path, pages=str(page_num), flavor='stream')
                
                if len(tables) > 0:
                    page_mcc_count = 0
                    for i, table in enumerate(tables):
                        # Extract MCC codes from this table
                        mcc_codes = extract_mcc_from_dataframe(table.df, f"{page_num}-{i + 1}")
                        if mcc_codes:
                            all_mcc_data.update(mcc_codes)
                            successful_pages.append(page_num)
                            page_mcc_count += len(mcc_codes)
                    
                    if page_mcc_count > 0:
                        print(f"✅ Found {page_mcc_count} MCC codes")
                    else:
                        print("❌ No valid MCC data found")
                else:
                    print("❌ No tables found")
                    
            except Exception as e:
                print(f"❌ Error: {str(e)[:50]}...")
                failed_pages.append(page_num)
                continue
        
        # Summary
        print()
        total_codes = len(all_mcc_data)
        if successful_pages:
            unique_successful = sorted(list(set(successful_pages)))
            print(f"✅ Successfully processed {len(unique_successful)} pages: {unique_successful}")
        if failed_pages:
            print(f"⚠️  Failed pages: {failed_pages}")
        
        print(f"📊 Total MCC codes extracted: {total_codes}")
        
        return all_mcc_data
        
    except Exception as e:
        print(f"Error extracting tables with Camelot: {e}")
        return {}

def extract_mcc_from_dataframe(df, table_num):
    """Extract MCC codes from a pandas DataFrame with predictable structure"""
    mcc_data = {}
    
    # Simple approach: Column 0 = MCC code, Column 1 = Description
    for idx, row in df.iterrows():
        try:
            # Extract MCC code from first column
            col1 = str(row.iloc[0]).strip() if len(row) > 0 else ""
            mcc_match = re.search(r'\b(\d{4})\b', col1)
            
            if mcc_match:
                mcc_code = mcc_match.group(1)
                
                # Extract description from second column  
                if len(row) > 1:
                    description = str(row.iloc[1]).strip()
                    if description and description != 'nan':
                        description = clean_description(description)
                        if description and len(description) >= MIN_DESCRIPTION_LENGTH:
                            mcc_data[mcc_code] = description
                    
        except Exception as e:
            continue
    
    return mcc_data

def clean_description(description):
    """Clean and normalize MCC description"""
    if not description:
        return ""
    
    # Remove extra whitespace
    description = re.sub(r'\s+', ' ', description.strip())
    
    # Replace Unicode dashes with regular hyphens
    description = description.replace('\u2013', '-').replace('\u2014', '-')
    
    # Replace Unicode quotation marks with regular apostrophes
    description = description.replace('\u2018', "'").replace('\u2019', "'").replace('\u201C', '"').replace('\u201D', '"')
    
    # Remove common artifacts
    description = re.sub(r'^[-–\s]+|[-–\s]+$', '', description)
    
    # Skip obviously bad descriptions
    bad_patterns = [
        r'^\d+$',           # Only numbers
        r'^[-–\s]*$',       # Only dashes/spaces
        r'^(MCC|Title|Description)$',  # Header words
        r'^\([^)]*\)$',     # Only parentheses content
        r'^nan$',           # NaN values
    ]
    
    for pattern in bad_patterns:
        if re.match(pattern, description, re.IGNORECASE):
            return ""
    
    # Skip if too short after cleaning
    if len(description) < MIN_DESCRIPTION_LENGTH:
        return ""
    
    return description

def save_results(mcc_data, output_file='mcc_data_output.json'):
    """Save results to JSON file"""
    try:
        with open(output_file, 'w') as f:
            json.dump(mcc_data, f, indent=2, sort_keys=True)
        print(f"Results saved to {output_file}")
        return True
    except Exception as e:
        print(f"Error saving results: {e}")
        return False

if __name__ == "__main__":
    pdf_path = "mcc.pdf"
    start_page = None  # Auto-detect if not specified
    end_page = None    # Auto-detect if not specified
    method = 'lattice'
    
    # Parse command line arguments
    if len(sys.argv) > 1:
        pdf_path = sys.argv[1]
    if len(sys.argv) > 2:
        start_page = int(sys.argv[2])
    if len(sys.argv) > 3:
        # Check if argv[3] is a number (end_page) or string (method)
        try:
            end_page = int(sys.argv[3])
            # If we successfully parsed end_page, check for method in argv[4]
            if len(sys.argv) > 4:
                method = sys.argv[4].lower()
        except ValueError:
            # argv[3] is not a number, so it must be the method
            method = sys.argv[3].lower()
    
    # Check if PDF file exists
    if not os.path.exists(pdf_path):
        print(f"Error: PDF file '{pdf_path}' not found")
        sys.exit(1)
    
    print("="*60)
    print("MCC PDF EXTRACTION USING CAMELOT")
    print("="*60)
    print(f"PDF file: {pdf_path}")
    if start_page and end_page:
        print(f"Page range: {start_page}-{end_page}")
    else:
        print("Page range: Auto-detect")
    print(f"Method: {method}")
    print()
    
    # Extract MCC data
    mcc_data = extract_mcc_with_camelot(pdf_path, start_page, end_page, method)
    
    if mcc_data:
        # Save results
        save_results(mcc_data)
        print(f"\n🎉 Successfully extracted {len(mcc_data)} MCC codes!")
    else:
        print("\n❌ No MCC data extracted.")
        save_results({})