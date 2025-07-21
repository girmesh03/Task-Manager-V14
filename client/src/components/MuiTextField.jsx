import { memo } from "react";
import PropTypes from "prop-types";
import { Controller } from "react-hook-form";
import TextField from "@mui/material/TextField";

const MuiTextField = memo(({ name, control, rules, ...props }) => (
  <Controller
    name={name}
    control={control}
    rules={rules}
    render={({ field, fieldState: { error } }) => (
      <TextField
        {...field}
        id={name}
        size="small"
        variant="outlined"
        fullWidth
        margin="normal"
        required={!!rules?.required}
        error={!!error}
        helperText={error?.message}
        {...props}
      />
    )}
  />
));

MuiTextField.propTypes = {
  name: PropTypes.string.isRequired,
  control: PropTypes.object.isRequired,
  rules: PropTypes.object,
};

export default MuiTextField;
