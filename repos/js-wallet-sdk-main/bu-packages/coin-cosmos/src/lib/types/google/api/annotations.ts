/* eslint-disable */
import { Long, _m0 } from "@okxweb3/coin-base";

export const protobufPackage = "google.api";

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}
