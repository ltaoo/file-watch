export type SourceNode = {
  key: string;
  title: string;
  children?: Array<SourceNode>;
};

export type FormattedSourceNode = {
  key: string;
  title: string;
  pos: string;
  children?: Array<FormattedSourceNode>;
  [propsName: string]: unknown;
};
