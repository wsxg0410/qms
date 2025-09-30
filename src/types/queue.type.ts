export interface QueueOption<D = any> {
  env: string;
  unique?: boolean;
  priority?: number;
  genKeyData?: (data: D) => any;
}
