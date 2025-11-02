
/** ABI */
export type Abi = ReadonlyArray<FunctionAbi | AbiStruct | InterfaceAbi | any>;

// Basic elements
export type AbiEntry = { name: string; type: 'felt' | 'felt*' | 'event' | string };

export type EventEntry = { name: string; type: 'felt' | 'felt*' | string; kind: 'key' | 'data' };

type FunctionAbiType = 'function' | 'l1_handler' | 'constructor';

// Sub elements
export type FunctionAbi = {
  inputs: AbiEntry[];
  name: string;
  outputs: AbiEntry[];
  stateMutability?: 'view';
  state_mutability?: string; // Cairo 1 Abi
  type: FunctionAbiType;
};

export type AbiStructs = { [name: string]: AbiStruct };

export type AbiStruct = {
  members: (AbiEntry & { offset: number })[];
  name: string;
  size: number;
  type: 'struct';
};

export type AbiInterfaces = { [name: string]: InterfaceAbi };
export type InterfaceAbi = {
  items: FunctionAbi[];
  name: string;
  type: 'interface';
};

export type AbiEnums = { [name: string]: AbiEnum };
export type AbiEnum = {
  variants: (AbiEntry & { offset: number })[];
  name: string;
  size: number;
  type: 'enum';
};



