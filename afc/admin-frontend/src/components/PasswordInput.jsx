import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput({ label = "password", ...inputProps }) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="password-input">
      <input {...inputProps} aria-label={label} type={visible ? "text" : "password"} />
      <button
        className="password-toggle"
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={`${visible ? "Hide" : "Show"} ${label}`}
        aria-pressed={visible}
        title={`${visible ? "Hide" : "Show"} ${label}`}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </span>
  );
}
