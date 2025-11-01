import clsx from "clsx";
import type React from "react";

type CustomLinkProps = {
  href?: string;
  children?: React.ReactNode;
};

const CustomLink = ({ href, children, ...props }: CustomLinkProps) => (
  <a
    href={href}
    {...props}
    className="rounded-full bg-gray-200 px-2 py-1 font-medium text-sm hover:bg-black hover:text-white"
  >
    {children}
  </a>
);

type TextMessageProps = {
  text: string;
  isUser: boolean;
};

export function TextMessage({ text, isUser }: TextMessageProps) {
  return (
    <div
      className={clsx("flex flex-row gap-2", {
        "justify-end py-2": isUser,
      })}
    >
      <div
        className={clsx("rounded-[16px]", {
          "ml-4 max-w-[90%] bg-[#ededed] px-4 py-2 text-stone--900": isUser,
          "mr-4 max-w-[90%] bg-white px-4 py-2 text-black": !isUser,
        })}
      >
        {text}
      </div>
    </div>
  );
}
