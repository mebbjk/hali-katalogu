import React from 'react';

// A generic IconProps type for all icons
interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

const createIcon = (path: React.ReactNode): React.FC<IconProps> => (props) => 
  React.createElement('svg', {
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    ...props
  }, path);

export const HomeIcon = createIcon(
  React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" })
);

export const PlusIcon = createIcon(
  React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 4.5v15m7.5-7.5h-15" })
);

export const CameraIcon = createIcon(
  React.createElement(React.Fragment, null,
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.776 48.776 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" }),
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" })
  )
);

export const SearchIcon = createIcon(
  React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" })
);

export const HeartIcon = createIcon(
  React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" })
);

export const TrashIcon = createIcon(
  React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" })
);

export const XMarkIcon = createIcon(
  React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18 18 6M6 6l12 12" })
);

export const Cog6ToothIcon = createIcon(
  React.createElement(React.Fragment, null,
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" }),
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" })
  )
);

export const WandSparkles = createIcon(
  React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" })
);

export const QrCodeIcon = createIcon(
  React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M3.75 4.5a.75.75 0 0 0-.75.75v2.25c0 .414.336.75.75.75h2.25a.75.75 0 0 0 .75-.75V5.25a.75.75 0 0 0-.75-.75H3.75Zm0 9.75a.75.75 0 0 0-.75.75v2.25c0 .414.336.75.75.75h2.25a.75.75 0 0 0 .75-.75v-2.25a.75.75 0 0 0-.75-.75H3.75Zm9.75 0a.75.75 0 0 0-.75.75v2.25c0 .414.336.75.75.75h2.25a.75.75 0 0 0 .75-.75v-2.25a.75.75 0 0 0-.75-.75H13.5Zm9.75-9.75a.75.75 0 0 0-.75.75v2.25c0 .414.336.75.75.75h2.25a.75.75 0 0 0 .75-.75V5.25a.75.75 0 0 0-.75-.75H13.5Zm-9.75 0a.75.75 0 0 0-.75.75v2.25c0 .414.336.75.75.75h2.25a.75.75 0 0 0 .75-.75V5.25a.75.75 0 0 0-.75-.75H13.5ZM3.75 9a.75.75 0 0 0-.75.75v2.25c0 .414.336.75.75.75h2.25a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75H3.75Zm9.75 0a.75.75 0 0 0-.75.75v2.25c0 .414.336.75.75.75h2.25a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75H13.5Zm9.75 0a.75.75 0 0 0-.75.75v2.25c0 .414.336.75.75.75H24a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-2.25Zm-9.75 9.75a.75.75 0 0 0-.75.75v2.25c0 .414.336.75.75.75h2.25a.75.75 0 0 0 .75-.75v-2.25a.75.75 0 0 0-.75-.75H13.5Z" })
);

export const BarcodeIcon = createIcon(
  React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M3.75 4.875c0-.621.504-1.125 1.125-1.125h.375c.621 0 1.125.504 1.125 1.125v14.25c0 .621-.504 1.125-1.125 1.125h-.375c-.621 0-1.125-.504-1.125-1.125V4.875Zm7.5 0c0-.621.504-1.125 1.125-1.125h.375c.621 0 1.125.504 1.125 1.125v14.25c0 .621-.504 1.125-1.125 1.125h-.375c-.621 0-1.125-.504-1.125-1.125V4.875Zm7.5 0c0-.621.504-1.125 1.125-1.125h.375c.621 0 1.125.504 1.125 1.125v14.25c0 .621-.504 1.125-1.125 1.125h-.375c-.621 0-1.125-.504-1.125-1.125V4.875Z" })
);


export const ArrowDownTrayIcon = createIcon(
  React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" })
);

export const ArrowUpTrayIcon = createIcon(
  React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" })
);


export const Spinner: React.FC<IconProps> = (props) => 
  React.createElement('svg', {
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    ...props
  }, 
  React.createElement(React.Fragment, null,
    React.createElement('circle', { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
    React.createElement('path', { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })
  ));