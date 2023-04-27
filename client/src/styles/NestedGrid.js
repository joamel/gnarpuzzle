import React from "react";
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

function FormRow() {
  return (
    <>
      <Grid item xs={1}>
        <Item>Item</Item>
      </Grid>
      <Grid item xs={1}>
        <Item>Item</Item>
      </Grid>
      <Grid item xs={1}>
        <Item>Item</Item>
      </Grid>
      <Grid item xs={1}>
        <Item>Item</Item>
      </Grid>
      <Grid item xs={1}>
        <Item>Item</Item>
      </Grid>
    </>
  );
}

export default function NestedGrid() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={1}>
      {/* {array &&
					array.map((arr) => {
						return <li key={user.id}>{user.username}</li>;
					})} */}
        <Grid container item spacing={1}>
          <FormRow />
        </Grid>
        <Grid container item spacing={1}>
          <FormRow />
        </Grid>
        <Grid container item spacing={1}>
          <FormRow />
        </Grid>
        <Grid container item spacing={1}>
          <FormRow />
        </Grid>
        <Grid container item spacing={1}>
          <FormRow />
        </Grid>
      </Grid>
    </Box>
  );
}