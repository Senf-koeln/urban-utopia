import * as React from "react";
import { type ClassValue, tv } from "tailwind-variants";
import useKeyboardFocus from "../../../hooks/useKeyboardFocus";
import { useMeasure } from "../../../hooks/useMeasure";
import { cn } from "../../../util/classNameConstructor";
import Divider from "../../atoms/divider/Divider";
import Checkbox from "../../core/checkbox/Checkbox";
import Icon from "../icon/Icon";
import type { IconName } from "../icon/names";
import TooltipProvider from "../tooltip/TooltipProvider";

const ListItemVariant = tv({
  slots: {
    wrapper: "group relative flex w-full flex-col justify-center",
    base: "focus-visible:outline-text-default inline-flex h-16 w-full grow cursor-pointer items-center gap-4 rounded-lg group-first/outer:rounded-t-xl group-last/outer:rounded-b-xl px-4 py-3 outline-offset-[-2px] focus-visible:outline-2 focus-visible:hover:outline-none group-outer",
    textArea:
      "list-item-text flex flex-1 flex-col justify-center gap-1 text-start min-w-0",
    primaryText: cn(
      "body-md-semibold text-text-default -mb-1 text-left [overflow-wrap:anywhere] [text-wrap:balance]",
    ),
    secondaryText: cn(
      "body-sm text-text-subdued line-clamp-1 text-left [overflow-wrap:anywhere] [text-wrap:balance]",
    ),
    dividerStyle: `
      absolute
      mr-3
      [.group:is(:hover,_.selected)_&]:opacity-0
      [.group:is(:hover,_.selected)_+_*_&]:opacity-0
    `,
  },
  variants: {
    action: {
      true: {
        base: "pr-3.5",
        textArea: "w-[50%]",
      },
    },
    selected: {
      true: {
        wrapper: "selected",
        base: "bg-surface-highlight-subdued",
      },
    },
    disabled: {
      true: {
        base: "cursor-not-allowed",
        primaryText: "text-text-disabled",
        secondaryText: "text-text-placeholder",
      },
    },
    hoverable: {
      true: {
        base: "hover:bg-action-tertiary-hovered active:bg-action-tertiary-pressed [&:hover_.checkbox_button]:text-border-highlight-default",
      },
    },
    multiLine: {
      false: {
        base: "h-6 gap-2 rounded-lg px-2 py-4",
        textArea: "justify-center",
        dividerStyle: "ml-10",
      },
      true: {
        base: "box-border [&>*:last-child]:h-9",
        dividerStyle: "ml-14",
      },
    },
  },
});

export interface ListItemProps extends React.HTMLAttributes<HTMLElement> {
  id?: string;
  index?: number;
  leadingIcon?: IconName | React.ReactNode;
  leadingIconProps?: React.HTMLAttributes<HTMLDivElement>;
  selectable?: boolean;
  selectableType?: "checkbox" | "radio";
  hoverable?: boolean;
  action?: JSX.Element;
  primaryContent: string | JSX.Element;
  secondaryContent?: string | JSX.Element;
  tag?: "button" | "div";
  className?: string;
  classNames?: Partial<
    Record<keyof (typeof ListItemVariant)["slots"], ClassValue>
  >;
  lines?: 1 | 2;
  divider?: boolean;
  disabled?: boolean;
  selected?: boolean;
  disabledNotice?: string;
  noTooltip?: boolean;
  primaryContentProps?: React.HTMLAttributes<HTMLDivElement>;
  tabIndex?: number;
  preventKeyDown?: boolean;
}

const ListItem: React.FC<ListItemProps> = ({
  id,
  index,
  leadingIcon,
  leadingIconProps,
  selectable = false,
  hoverable = true,
  primaryContent,
  primaryContentProps,
  secondaryContent,
  selected = false,
  action,
  className,
  classNames,
  lines,
  divider,
  disabled,
  disabledNotice,
  onClick,
  noTooltip,
  preventKeyDown,
  tabIndex = 0,
  ...props
}) => {
  const [{ ref: actionRef }, { width }] = useMeasure<HTMLDivElement>({
    trackPosition: false,
  });
  const { className: leadingIconClassName, ...leadingIconPropsRest } =
    leadingIconProps || {};
  const { wrapper, base, primaryText, secondaryText, textArea, dividerStyle } =
    ListItemVariant({
      selected,
      hoverable: hoverable && !disabled,
      disabled,
      action: !!action,
      multiLine: lines === 2 || !!secondaryContent,
    });
  const { focusVisible, attachListeners, removeListeners } = useKeyboardFocus();

  const buttonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    attachListeners(buttonRef.current);
    return () => {
      removeListeners(buttonRef.current);
    };
  }, [attachListeners, removeListeners]);

  const Tag = selectable ? "div" : props.tag || "button";

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (
      !preventKeyDown &&
      !noTooltip &&
      !disabled &&
      (e.key === "Enter" || e.key === " ")
    ) {
      e.preventDefault();
      onClick?.(e as unknown as React.MouseEvent<HTMLElement>);
    }
  };

  const Item = (
    <div
      className={wrapper({
        className: classNames?.wrapper,
      })}
      onKeyDown={handleKeyDown}
    >
      {divider && index !== 0 && <Divider className={dividerStyle()} />}

      <Tag
        className={base({
          className: classNames?.base,
        })}
        {...props}
        ref={buttonRef as unknown as any}
        id={id}
        tabIndex={tabIndex}
        role={selectable ? "button" : undefined}
        aria-selected={selected}
        style={
          width
            ? {
                paddingInlineEnd: width + 20,
              }
            : {}
        }
      >
        {selectable && (
          <div className="pointer-events-none">
            <Checkbox
              checked={selected}
              className="box-content"
              aria-label={`select ${primaryContent}`}
              disabled={disabled}
              tabIndex={-1}
              type={props.selectableType}
            />
          </div>
        )}
        {typeof leadingIcon === "string" ? (
          <Icon
            name={leadingIcon as IconName}
            className={cn("shrink-0", leadingIconClassName)}
            {...(leadingIconPropsRest as React.HTMLAttributes<SVGSVGElement>)}
          />
        ) : (
          leadingIcon
        )}
        {(primaryContent || secondaryContent) && (
          <div className={textArea({ className: classNames?.textArea })}>
            {primaryContent && (
              <div
                {...primaryContentProps}
                className={primaryText({
                  className: cn(
                    lines === 2 ? "line-clamp-2" : "line-clamp-1",
                    selected && "",
                    classNames?.primaryText,
                    primaryContentProps?.className,
                  ),
                })}
              >
                {primaryContent}
              </div>
            )}

            {secondaryContent && (
              <div
                className={secondaryText({
                  className: classNames?.secondaryText,
                })}
              >
                {secondaryContent}
              </div>
            )}
          </div>
        )}
      </Tag>
      <div className="absolute end-3" ref={actionRef}>
        {action}
      </div>
    </div>
  );

  return (
    <TooltipProvider
      critical={true}
      disabled={disabled}
      primaryContent={disabledNotice}
      noTooltip={noTooltip || !disabled}
      onClick={onClick}
      className={cn(className, "group/outer")}
    >
      {Item}
    </TooltipProvider>
  );
};

export default ListItem;
