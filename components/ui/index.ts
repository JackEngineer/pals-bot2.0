// 基础组件
export * from "./button";
export * from "./input";
export * from "./textarea";
export * from "./card";
export * from "./dialog";
export * from "./badge";
export * from "./skeleton";
export * from "./Icon";

// 重新导出常用组件的别名
export { Button } from "./button";
export { Input } from "./input";
export { Textarea } from "./textarea";
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./card";
export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "./dialog";
export { Badge } from "./badge";
export {
  Skeleton,
  SkeletonCard,
  SkeletonBottleCard,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
} from "./skeleton";
export { default as Icon } from "./Icon";
