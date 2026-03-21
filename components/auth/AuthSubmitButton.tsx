import { Button } from "@/components/ui/button";

export function AuthSubmitButton({ label = "Ingresar con Google" }: { label?: string }) {
  return <Button type="submit" className="w-full bg-primary-gradient">{label}</Button>;
}
