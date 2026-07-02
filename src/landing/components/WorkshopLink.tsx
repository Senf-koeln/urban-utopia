import { Link, type LinkProps } from "react-router-dom";
import { WORKSHOP_START_PATH } from "../constants";

type WorkshopLinkProps = Omit<LinkProps, "to">;

export function WorkshopLink({ children, ...props }: WorkshopLinkProps) {
  return (
    <Link to={WORKSHOP_START_PATH} {...props}>
      {children}
    </Link>
  );
}
