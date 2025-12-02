import torch
from diffusers import AutoPipelineForText2Image
from diffusers.utils import load_image

class ImageEngine:
    def __init__(self):
        print("Loading Image Model (SDXL Turbo)... this may take a minute.")
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Running on device: {self.device}")
        
        # SDXL Turbo is very fast (1 step generation)
        model_id = "stabilityai/sdxl-turbo"
        
        # Use float16 for GPU, float32 for CPU
        torch_dtype = torch.float16 if self.device == "cuda" else torch.float32
        variant = "fp16" if self.device == "cuda" else None
        
        self.pipe = AutoPipelineForText2Image.from_pretrained(
            model_id, 
            torch_dtype=torch_dtype, 
            variant=variant
        )
        self.pipe.to(self.device)

    def generate_image(self, prompt, output_path="output.png"):
        print(f"Generating image for: '{prompt}'")
        
        # SDXL Turbo needs only 1-4 steps
        image = self.pipe(prompt=prompt, num_inference_steps=1, guidance_scale=0.0).images[0]
        
        # Add Branding Watermark
        try:
            from PIL import ImageDraw, ImageFont
            draw = ImageDraw.Draw(image)
            
            # Text to draw
            text = "Cool-Shot Systems"
            
            # Try to load a font, fallback to default if not found
            try:
                # Try to load a standard font
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
            except:
                font = ImageFont.load_default()
            
            # Calculate text size and position
            try:
                bbox = draw.textbbox((0, 0), text, font=font)
                text_width = bbox[2] - bbox[0]
                text_height = bbox[3] - bbox[1]
            except:
                text_width = 150
                text_height = 20

            width, height = image.size
            padding = 10
            text_x = width - text_width - padding
            text_y = height - text_height - padding
            
            # Draw semi-transparent background
            # Create a separate image for the alpha layer
            from PIL import Image
            overlay = Image.new('RGBA', image.size, (0, 0, 0, 0))
            overlay_draw = ImageDraw.Draw(overlay)
            
            # Draw a black rectangle with 50% opacity behind the text
            rect_x0 = text_x - 5
            rect_y0 = text_y - 5
            rect_x1 = text_x + text_width + 5
            rect_y1 = text_y + text_height + 5
            overlay_draw.rectangle([rect_x0, rect_y0, rect_x1, rect_y1], fill=(0, 0, 0, 128))
            
            # Composite the overlay
            image = Image.alpha_composite(image.convert('RGBA'), overlay)
            draw = ImageDraw.Draw(image) # Re-create draw object for the new image
            
            # Draw text in white
            draw.text((text_x, text_y), text, font=font, fill="white")
            
            print("Branding added.")
        except Exception as e:
            print(f"Warning: Could not add watermark: {e}")

        image = image.convert('RGB')
        image.save(output_path)
        print(f"Image saved to {output_path}")
        return output_path

if __name__ == "__main__":
    # Simple test
    engine = ImageEngine()
    engine.generate_image("A cinematic shot of a robot painting a canvas")
