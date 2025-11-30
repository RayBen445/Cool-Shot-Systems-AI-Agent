import sys
from chat_engine import ChatEngine
from image_engine import ImageEngine

def main():
    print("Initializing Local AI Assistant...")
    
    # Initialize engines (lazy loading could be better, but let's load upfront for now)
    chat_engine = None
    image_engine = None

    while True:
        print("\n" + "="*30)
        print(" LOCAL AI ASSISTANT")
        print("="*30)
        print("1. Chat")
        print("2. Generate Image")
        print("3. Exit")
        
        choice = input("\nEnter your choice (1-3): ").strip()
        
        if choice == "1":
            if chat_engine is None:
                chat_engine = ChatEngine()
            
            print("\n--- Chat Mode (Type 'exit' to go back) ---")
            history = []
            while True:
                user_input = input("You: ")
                if user_input.lower() in ['exit', 'quit']:
                    break
                
                response = chat_engine.generate_response(user_input, history)
                print(f"AI: {response}")
                
                # Update history
                history.append({"role": "user", "content": user_input})
                history.append({"role": "assistant", "content": response})
                
        elif choice == "2":
            if image_engine is None:
                image_engine = ImageEngine()
                
            print("\n--- Image Mode (Type 'exit' to go back) ---")
            while True:
                prompt = input("Enter image description: ")
                if prompt.lower() in ['exit', 'quit']:
                    break
                
                import time
                timestamp = int(time.time())
                filename = f"generated_{timestamp}.png"
                image_engine.generate_image(prompt, output_path=filename)
                
        elif choice == "3":
            print("Goodbye!")
            sys.exit(0)
        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    main()
