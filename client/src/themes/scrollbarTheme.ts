import { createTheme } from '@mui/material/styles';

export const scrollbarTheme = createTheme({
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            backgroundColor: '#151E23',
            width: '16px',
            height: '16px',
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            background: '#212F36',
            borderRadius: 4,
            border: '2px #151E23 solid',
          },
          '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active': {
            backgroundColor: '#00A3FF',
          },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#00A3FF',
          },
          '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
            backgroundColor: '#151E23',
            borderRadius: 0,
          },
          '&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner': {
            backgroundColor: 'transparent',
            borderRadius: 0,
            height: '16px',
            width: '16px',
          },
          '&::-webkit-scrollbar-button:single-button, & *::-webkit-scrollbar-button:single-button': {
            backgroundColor: '#151E23',
            display: 'block',
            height: '16px',
            width: '16px',
          },
          '&::-webkit-scrollbar-button:single-button:vertical:decrement, & *::-webkit-scrollbar-button:single-button:vertical:decrement': {
            borderColor: 'transparent transparent #212F36 transparent',
            borderStyle: 'solid',
            borderWidth: '0px 8px 16px 8px',
            height: '16px',
            width: '16px',
          },
          '&::-webkit-scrollbar-button:single-button:vertical:decrement:hover, & *::-webkit-scrollbar-button:single-button:vertical:decrement:hover':
            {
              borderColor: 'transparent transparent #00A3FF transparent',
            },
          '&::-webkit-scrollbar-button:single-button:vertical:decrement:active, & *::-webkit-scrollbar-button:single-button:vertical:decrement:active':
            {
              borderColor: 'transparent transparent #212F36 transparent',
            },
          '&::-webkit-scrollbar-button:single-button:vertical:increment, & *::-webkit-scrollbar-button:single-button:vertical:increment': {
            borderColor: '#212F36 transparent transparent transparent',
            borderStyle: 'solid',
            borderWidth: '16px 8px 0px 8px',
            height: '16px',
            width: '16px',
          },
          '&::-webkit-scrollbar-button:single-button:vertical:increment:hover, & *::-webkit-scrollbar-button:single-button:vertical:increment:hover':
            {
              borderColor: '#00A3FF transparent transparent transparent',
            },
          '&::-webkit-scrollbar-button:single-button:vertical:increment:active, & *::-webkit-scrollbar-button:single-button:vertical:increment:active':
            {
              borderColor: '#212F36 transparent transparent transparent',
            },
          '&::-webkit-scrollbar-button:single-button:horizontal:decrement, & *::-webkit-scrollbar-button:single-button:horizontal:decrement':
            {
              borderColor: 'transparent #212F36 transparent transparent',
              borderStyle: 'solid',
              borderWidth: '8px 16px 8px 0px',
              height: '16px',
              width: '16px',
            },
          '&::-webkit-scrollbar-button:single-button:horizontal:decrement:hover, & *::-webkit-scrollbar-button:single-button:horizontal:decrement:hover':
            {
              borderColor: 'transparent #00A3FF transparent transparent',
            },
          '&::-webkit-scrollbar-button:single-button:horizontal:increment, & *::-webkit-scrollbar-button:single-button:horizontal:increment':
            {
              borderColor: 'transparent transparent transparent #212F36',
              borderStyle: 'solid',
              borderWidth: '8px 0px 8px 16px',
              height: '16px',
              width: '16px',
            },
          '&::-webkit-scrollbar-button:single-button:horizontal:increment:hover, & *::-webkit-scrollbar-button:single-button:horizontal:increment:hover':
            {
              borderColor: 'transparent transparent transparent #00A3FF',
            },
        },
      },
    },
  },
});
