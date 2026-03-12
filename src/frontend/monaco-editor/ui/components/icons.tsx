import type { FC, ReactNode } from "react";

import { MdPhoneAndroid, MdQrCode, MdShare, MdTabletAndroid, MdTv } from "../@/external/icons";

const Wrap: FC<{ children: ReactNode }> = ({ children }) => (
  <span className="text-2xl">{children}</span>
);

export const QrCodeIcon = () => (
  <Wrap>
    <MdQrCode />
  </Wrap>
);
export const Phone = () => (
  <Wrap>
    <MdPhoneAndroid />
  </Wrap>
);

export const Share = () => (
  <Wrap>
    <MdShare />
  </Wrap>
);

export const Tablet = () => (
  <Wrap>
    <MdTabletAndroid />
  </Wrap>
);

export const Tv = () => (
  <Wrap>
    <MdTv />
  </Wrap>
);
