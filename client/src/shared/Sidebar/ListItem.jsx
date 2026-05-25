import { ListItem, ListItemIcon } from "@mui/material";
import { NavLink } from "react-router";

export const ListItemCustom = ({ route, text, children  }) => {
  return (
    <ListItem button className="hover:bg-blue-800">
      <ListItemIcon>
        {children}
      </ListItemIcon>
      <NavLink to={route}>{text}</NavLink>
    </ListItem>
  );
};
