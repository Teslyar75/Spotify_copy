// Простая заглушка для resizable компонентов
// Используем обычные div вместо react-resizable-panels

const ResizablePanelGroup = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={className}
    {...props}
  />
)

const ResizablePanel = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={className}
    {...props}
  />
)

const ResizableHandle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`w-2 bg-black rounded-lg cursor-col-resize ${className || ''}`}
    {...props}
  />
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
