// mui status icon imports
import DoneIcon from "@mui/icons-material/Done";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import PendingIcon from "@mui/icons-material/Pending";
import ListIcon from "@mui/icons-material/List";

// mui priority icon imports
import HighPriorityIcon from "@mui/icons-material/PriorityHigh";
import MediumPriorityIcon from "@mui/icons-material/ImportExport";
import LowPriorityIcon from "@mui/icons-material/ArrowDownward";

// mui category icon imports
import ElectricalServicesIcon from "@mui/icons-material/ElectricalServices";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import PlumbingIcon from "@mui/icons-material/Plumbing";
import FormatPaintIcon from "@mui/icons-material/FormatPaint";
import BuildIcon from "@mui/icons-material/Build";
import CarpenterIcon from "@mui/icons-material/Carpenter";
import EngineeringIcon from "@mui/icons-material/Engineering";
import CategoryIcon from "@mui/icons-material/Category";

// mui task type icon
import AssignedTasksIcon from "@mui/icons-material/AssignmentInd";
import ProjectTasksIcon from "@mui/icons-material/AccountTree";

// mui user roles icon
import UserIcon from "@mui/icons-material/Person";
import ManagerIcon from "@mui/icons-material/SupervisorAccount";
import AdminIcon from "@mui/icons-material/AdminPanelSettings";
import SuperAdminIcon from "@mui/icons-material/Security";

// mui active, verified icons
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import UnverifiedUserIcon from "@mui/icons-material/Report";
import ActiveUserIcon from "@mui/icons-material/CheckCircle";
import InactiveUserIcon from "@mui/icons-material/Cancel";

export const DRAWER_WIDTH = 240;

export const companySizes = [
  { id: 1, label: "1-10 Employees" },
  { id: 2, label: "11-50 Employees" },
  { id: 3, label: "51-200 Employees" },
  { id: 4, label: "201-500 Employees" },
  { id: 5, label: "500+ Employees" },
];

export const industries = [
  { id: 1, label: "Hospitality" },
  { id: 2, label: "Technology" },
  { id: 3, label: "Healthcare" },
  { id: 4, label: "Finance" },
  { id: 5, label: "Education" },
  { id: 6, label: "Retail" },
  { id: 7, label: "Manufacturing" },
  { id: 8, label: "Consulting" },
  { id: 9, label: "Other" },
];

// statusTypes
export const statusTypes = [
  { id: 1, label: "Completed", icon: DoneIcon },
  { id: 2, label: "In Progress", icon: HourglassEmptyIcon },
  { id: 3, label: "Pending", icon: PendingIcon },
  { id: 4, label: "To Do", icon: ListIcon },
];

// priorityTypes
export const priorityTypes = [
  { id: 1, label: "High", icon: HighPriorityIcon },
  { id: 2, label: "Medium", icon: MediumPriorityIcon },
  { id: 3, label: "Low", icon: LowPriorityIcon },
];

// categoryTypes
export const categoryTypes = [
  { id: 1, label: "Electrical", icon: ElectricalServicesIcon },
  { id: 2, label: "HVAC", icon: AcUnitIcon },
  { id: 3, label: "Plumbing", icon: PlumbingIcon },
  { id: 4, label: "Painting", icon: FormatPaintIcon },
  { id: 5, label: "Mechanical", icon: BuildIcon },
  { id: 6, label: "Carpentry", icon: CarpenterIcon },
  { id: 7, label: "Civil", icon: EngineeringIcon },
  { id: 8, label: "Other", icon: CategoryIcon },
];

export const taskCategoryTypes = [
  { id: 1, label: "AssignedTask", icon: AssignedTasksIcon },
  { id: 2, label: "ProjectTask", icon: ProjectTasksIcon },
];

// user roles
export const userRoleTypes = [
  { id: 1, label: "User", icon: UserIcon },
  { id: 2, label: "Manager", icon: ManagerIcon },
  { id: 3, label: "Admin", icon: AdminIcon },
  { id: 4, label: "SuperAdmin", icon: SuperAdminIcon },
];

// user active types
export const userActiveTypes = [
  { id: 1, label: "Active", icon: ActiveUserIcon },
  { id: 2, label: "Inactive", icon: InactiveUserIcon },
];

// user verified types
export const userVerifiedTypes = [
  { id: 1, label: "Verified", icon: VerifiedUserIcon },
  { id: 2, label: "Not Verified", icon: UnverifiedUserIcon },
];
