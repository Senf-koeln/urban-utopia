import { cn } from "../../../util/classNameConstructor";

const ModalHeader = ({ ...options }) => {
  const { nav, title, description, swipe } = options || {};
  return (
    <div
      className={cn(
        "flex flex-col",
        (title || description) && "p-5",
        (title || description) && (swipe ? "pt-10" : nav ? "0" : "pt-5"),
      )}
    >
      {nav}
      {(title || description) && (
        <div className="flex flex-col gap-2">
          {title && <h3 className="heading-lg text-text-default">{title}</h3>}
          {description && (
            <p className="body-md-semibold text-text-subdued">{description}</p>
          )}
        </div>
      )}
    </div>
  );
};
export default ModalHeader;
