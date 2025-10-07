"use client"

import * as React from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"


type Direction = "top" | "bottom" | "left" | "right"

const DirectionCtx = React.createContext<Direction>("right")

function Drawer({
  direction = "right",
  children,
  ...props
}: React.ComponentProps<typeof Dialog.Root> & { direction?: Direction }) {
  return (
    <DirectionCtx.Provider value={direction}>
      <Dialog.Root data-slot="drawer" {...props}>
        {children}
      </Dialog.Root>
    </DirectionCtx.Provider>
  )
}

function DrawerTrigger(props: React.ComponentProps<typeof Dialog.Trigger>) {
  return <Dialog.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal(props: React.ComponentProps<typeof Dialog.Portal>) {
  return <Dialog.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose(props: React.ComponentProps<typeof Dialog.Close>) {
  return <Dialog.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof Dialog.Overlay>) {
  return (
    <Dialog.Overlay
      data-slot="drawer-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  children,
  // allow overriding direction per-content if desired
  direction,
  ...props
}: React.ComponentProps<typeof Dialog.Content> & { direction?: Direction }) {
  const ctxDir = React.useContext(DirectionCtx)
  const dir = direction ?? ctxDir

  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay />
      <Dialog.Content
        data-slot="drawer-content"
        // keep the same data-attr name your Tailwind selectors expect:
        data-vaul-drawer-direction={dir}
        className={cn(
          "group/drawer-content fixed z-50 flex h-auto flex-col bg-background",
          // TOP
          "data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0",
          "data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh]",
          "data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b",
          // BOTTOM
          "data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0",
          "data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh]",
          "data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t",
          // RIGHT
          "data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0",
          "data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:border-l",
          "data-[vaul-drawer-direction=right]:sm:max-w-sm",
          // LEFT
          "data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0",
          "data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:border-r",
          "data-[vaul-drawer-direction=left]:sm:max-w-sm",
          className
        )}
        {...props}
      >
        {/* the little handle bar shown only for bottom drawers */}
        <div className="mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full bg-muted group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
        {children}
      </Dialog.Content>
    </DrawerPortal>
  )
}

function DrawerHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "flex flex-col gap-0.5 p-4 md:gap-1.5 md:text-left",
        "group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center",
        "group-data-[vaul-drawer-direction=top]/drawer-content:text-center",
        className
      )}
      {...props}
    />
  )
}

function DrawerFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof Dialog.Title>) {
  return (
    <Dialog.Title
      data-slot="drawer-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof Dialog.Description>) {
  return (
    <Dialog.Description
      data-slot="drawer-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
