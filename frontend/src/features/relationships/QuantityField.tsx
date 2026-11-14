import { MAX_QUANTITY } from "./quantity";

type Props = {
  // What the user typed. Kept as text, parseQuantity reads it when the form is sent.
  value: string;
  onChange: (value: string) => void;
};

// "How many? (optional)": shown in the connect forms and the map prompt, only when the chosen
// connection type allows an amount (hasQuantity in the template). Never shown in a web project.
// type="text" with inputMode="numeric": a phone shows the number keyboard, and the browser does not
// quietly turn "1.5" or "2e3" into something else before parseQuantity can say it is wrong.
export function QuantityField({ value, onChange }: Props) {
  return (
    <label>
      How many? (optional)
      <input
        type="text"
        inputMode="numeric"
        maxLength={String(MAX_QUANTITY).length}
        placeholder="For example 20"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
