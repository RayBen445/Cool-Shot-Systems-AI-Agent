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
            
            # Calculate text position (bottom right)
            # For default font, we can't easily get size, so we guess or just place it
            # For truetype, we can use getbbox
            
            width, height = image.size
            text_x = width - 180
            text_y = height - 30
            
            # Draw semi-transparent background for text
            # PIL doesn't support alpha text drawing directly on RGB images easily without converting
            # So we'll just draw white text with a black outline for visibility
            
            # Draw outline
            outline_color = "black"
            text_color = "white"
            
            x, y = text_x, text_y
            draw.text((x-1, y-1), text, font=font, fill=outline_color)
            draw.text((x+1, y-1), text, font=font, fill=outline_color)
            draw.text((x-1, y+1), text, font=font, fill=outline_color)
            draw.text((x+1, y+1), text, font=font, fill=outline_color)
            
            # Draw text
            draw.text((x, y), text, font=font, fill=text_color)
            
            print("Branding added.")
        except Exception as e:
            print(f"Warning: Could not add watermark: {e}")

        image.save(output_path)
        print(f"Image saved to {output_path}")
        return output_path

if __name__ == "__main__":
    # Simple test
    engine = ImageEngine()
    engine.generate_image("A cinematic shot of a robot painting a canvas")
