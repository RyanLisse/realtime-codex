import type * as React from "react";

const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    fill="currentColor"
    height={24}
    viewBox="0 0 24 24"
    width={24}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M4 12a8 8 0 1 1 16 0 8 8 0 0 1-16 0Zm8-10C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Zm1 5a1 1 0 1 0-2 0v4.586l-2.207 2.207a1 1 0 1 0 1.414 1.414l2.5-2.5A1 1 0 0 0 13 12V7Z"
      fillRule="evenodd"
    />
  </svg>
);

export default ClockIcon;
