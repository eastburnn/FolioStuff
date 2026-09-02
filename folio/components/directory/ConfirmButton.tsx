"use client";

// A submit button that asks for confirmation before letting the form post.
interface ConfirmButtonProps {
  message: string;
  className: string;
  children: React.ReactNode;
}

export default function ConfirmButton({ message, className, children }: ConfirmButtonProps) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
