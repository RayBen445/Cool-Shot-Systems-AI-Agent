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
        
        # Add Branding Watermark (Logo)
        try:
            from PIL import Image
            
            # Load Logo
            try:
                logo = Image.open("logo.png").convert("RGBA")
            except FileNotFoundError:
                print("Logo not found, skipping watermark.")
                image.save(output_path)
                return output_path

            # Resize Logo (e.g., 15% of image width)
            target_width = int(image.width * 0.15)
            aspect_ratio = logo.height / logo.width
            target_height = int(target_width * aspect_ratio)
            logo = logo.resize((target_width, target_height), Image.Resampling.LANCZOS)

            # Position: Bottom Right with padding
            padding = 20
            x = image.width - target_width - padding
            y = image.height - target_height - padding
            
            # Composite
            image = image.convert("RGBA")
            image.alpha_composite(logo, (x, y))
            image = image.convert("RGB")
            
            print("Logo watermark added.")
        except Exception as e:
            print(f"Warning: Could not add watermark: {e}")

        image.save(output_path)
        print(f"Image saved to {output_path}")
        return output_path

if __name__ == "__main__":
    # Simple test
    engine = ImageEngine()
    engine.generate_image("A cinematic shot of a robot painting a canvas")
