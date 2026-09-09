import heroPizza from "@/assets/hero-pizza.jpg";
import margherita from "@/assets/pizza-margherita.jpg";
import paneer from "@/assets/pizza-paneer.jpg";
import veggie from "@/assets/pizza-veggie.jpg";
import cheese from "@/assets/pizza-cheese.jpg";

/** Maps the database `image_key` of a pizza to a bundled image asset. */
export const pizzaImages: Record<string, string> = {
  margherita,
  paneer,
  veggie,
  cheese,
  custom: heroPizza,
};

export const pizzaImage = (key: string) => pizzaImages[key] ?? heroPizza;

export { heroPizza };
