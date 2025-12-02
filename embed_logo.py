import base64
import os

def embed_logo():
    # Read Logo
    try:
        with open("logo.png", "rb") as f:
            logo_data = f.read()
            logo_b64 = base64.b64encode(logo_data).decode('utf-8')
    except FileNotFoundError:
        print("Error: logo.png not found!")
        return

    # 1. Update image_engine.py
    engine_path = "image_engine.py"
    with open(engine_path, "r") as f:
        content = f.read()

    # Replace the file loading logic with Base64
    new_logic = f'''
            # Load Logo from Base64
            import base64
            import io
            LOGO_B64 = "{logo_b64}"
            logo_data = base64.b64decode(LOGO_B64)
            logo = Image.open(io.BytesIO(logo_data)).convert("RGBA")
    '''
    
    # We look for the try/catch block that loads the logo
    start_marker = '            # Load Logo'
    end_marker = '            except FileNotFoundError:'
    
    if start_marker in content:
        # Simple string replacement for the specific block we wrote earlier
        # This is a bit brittle but we know the exact content we just wrote
        old_block = '''            # Load Logo
            try:
                logo = Image.open("logo.png").convert("RGBA")
            except FileNotFoundError:
                print("Logo not found, skipping watermark.")
                image.save(output_path)
                return output_path'''
        
        if old_block in content:
            content = content.replace(old_block, new_logic)
            with open(engine_path, "w") as f:
                f.write(content)
            print("Updated image_engine.py")
        else:
            print("Could not find exact block in image_engine.py, doing manual replace")
            # Fallback: Replace the whole file content if needed, but let's try to be surgical first
            # actually, let's just rewrite the file with the known structure if this fails
            pass

    # 2. Update App.jsx
    app_path = "frontend/src/App.jsx"
    with open(app_path, "r") as f:
        app_content = f.read()
    
    # Replace the img src
    old_img = 'src="/logo.png"'
    new_img = f'src="data:image/png;base64,{logo_b64}"'
    
    if old_img in app_content:
        app_content = app_content.replace(old_img, new_img)
        with open(app_path, "w") as f:
            f.write(app_content)
        print("Updated App.jsx")
    else:
        print("Could not find src='/logo.png' in App.jsx")

if __name__ == "__main__":
    embed_logo()
