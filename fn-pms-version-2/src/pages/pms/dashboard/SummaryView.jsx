import { Grid } from "@mui/material";
import SummaryCard from "./SummaryCard";
import { useNavigate } from "react-router-dom";
import * as MuiIcons from '@mui/icons-material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const normalizeIconName = (icon) =>
  typeof icon === "string" && icon.endsWith("Icon")
    ? icon.replace("Icon", "")
    : icon;


const SummaryView = ({data}) => {
  const navigate = useNavigate();
  // dummy data – for example to send as prop 
  // const data = {
  //   open : {
  //     title : "Open Issues",
  //     count : 14,
  //     icon_name : "BugReportOutlinedIcon",
  //     color : "#1976d2",
  //     navigate : "/issues?status=open"
  //   },
  //   priority : {
  //     title : "High Priority",
  //     count : 13,
  //     icon_name : "PriorityHighOutlinedIcon",
  //     color : "#d32f2f",
  //     navigate : "/issues?priority=high"
  //   },
  //   mine : {
  //     title : "Assigned to Me",
  //     count : 9,
  //     icon_name : "AssignmentIndOutlinedIcon",
  //     color : "#388e3c",
  //     navigate : "/issues?assigned=me"
  //   },
  //   over_due : {
  //     title : "Overdue Issues",
  //     count : 2,
  //     icon_name : "WarningAmberOutlinedIcon",
  //     color : "#ed6c02",
  //     navigate : "/issues?filter=overdue"
  //   },
  // };
  return (
    <Grid container spacing={2} paddingBottom={3}>
      {Object.values(data).map((item, index) => {
        const IconComponent = (item.icon_name && MuiIcons[normalizeIconName(item.icon_name)]) || HelpOutlineIcon ;
        return (
          <Grid item xs={12} md={3} key={index}>
            <SummaryCard
              title={item.title}
              count={item.count}
              icon={<IconComponent fontSize="large" />}
              color={item.color}
              onClick={() => navigate(item.navigate)}
            />
          </Grid>
        );
      })}
    </Grid>
  );
};

export default SummaryView;
