import base64
import os

def get_logo_base64():
    """
    Returns the Cool Shot AI logo as a base64 encoded data URL.
    This is embedded directly in the code to avoid binary file issues in Git.
    """
    # Placeholder - in actual implementation, this would contain the full base64 encoded PNG
    # For now, return a simple SVG as base64
    svg_logo = '''<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
        <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:rgb(59,130,246);stop-opacity:1" />
                <stop offset="50%" style="stop-color:rgb(168,85,247);stop-opacity:1" />
                <stop offset="100%" style="stop-color:rgb(236,72,153);stop-opacity:1" />
            </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill="url(#grad)"/>
        <path d="M32 16 L32 48 M20 32 L44 32 M26 26 L38 38 M38 26 L26 38" 
              stroke="white" stroke-width="3" stroke-linecap="round"/>
        <text x="32" y="38" font-family="Arial" font-size="14" fill="white" 
              text-anchor="middle" font-weight="bold">AI</text>
    </svg>'''
    
    # Convert to base64
    logo_base64 = base64.b64encode(svg_logo.encode('utf-8')).decode('utf-8')
    return f"data:image/svg+xml;base64,{logo_base64}"

def save_logo_to_file(output_path='logo_base64.txt'):
    """
    Save the base64 encoded logo to a text file for reference.
    """
    logo_data = get_logo_base64()
    with open(output_path, 'w') as f:
        f.write(logo_data)
    print(f"Logo base64 saved to {output_path}")

if __name__ == "__main__":
    # Generate and save the logo
    save_logo_to_file()
    print("Logo embedded successfully")
    print(f"Data URL length: {len(get_logo_base64())} characters")
