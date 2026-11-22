import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";
import { focusClass, inputClass, labelClass } from "./authStyles";

export default function PasswordField({ label, name, autoComplete, minLength, readOnly, hint }) {
  const inputId = useId();
  const hintId = useId();
  const [showPassword, setShowPassword] = useState(false);
  const VisibilityIcon = showPassword ? EyeOff : Eye;

  return (
    <div>
      <label htmlFor={inputId} className={labelClass}>{label}</label>
      <div className="relative">
        <input
          id={inputId}
          name={name}
          type={showPassword ? "text" : "password"}
          autoComplete={autoComplete}
          aria-describedby={hint ? hintId : undefined}
          required
          minLength={minLength}
          readOnly={readOnly}
          className={`${inputClass} pr-14`}
        />
        <button
          type="button"
          aria-label={`${showPassword ? "Hide" : "Show"} ${label.toLowerCase()}`}
          onClick={() => setShowPassword(!showPassword)}
          className={`absolute inset-y-0 right-1 my-1 grid w-11 cursor-pointer place-items-center rounded-lg text-gray-600 hover:bg-gray-100 ${focusClass}`}
        >
          <VisibilityIcon className="size-5" aria-hidden="true" />
        </button>
      </div>
      {hint && <p id={hintId} className="mt-2 text-sm text-gray-600">{hint}</p>}
    </div>
  );
}
