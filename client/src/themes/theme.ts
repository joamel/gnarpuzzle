import { Theme } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { SxProps as MuiSxProps } from '@mui/material';
import { scrollbarTheme } from '../themes/scrollbarTheme.ts';

declare module '@mui/material/styles' {
  interface TypographyVariants {
    tableText: React.CSSProperties;
    highlightText: React.CSSProperties;
    columnHeader: React.CSSProperties;
    columnHighlight: React.CSSProperties;
    bigHeader: React.CSSProperties;
    sleekHeader: React.CSSProperties;
    bigText: React.CSSProperties;
    graphHeader: React.CSSProperties;
    sectionHeader: React.CSSProperties;
  }

  // allow configuration using `createTheme`
  interface TypographyVariantsOptions {
    tableText?: React.CSSProperties;
    highlightText?: React.CSSProperties;
    columnHeader?: React.CSSProperties;
    columnHighlight?: React.CSSProperties;
    bigHeader?: React.CSSProperties;
    sleekHeader?: React.CSSProperties;
    bigText?: React.CSSProperties;
    graphHeader?: React.CSSProperties;
    sectionHeader?: React.CSSProperties;
  }
}

// Update the Typography's variant prop options
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    tableText: true;
    highlightText: true;
    columnHeader: true;
    columnHighlight: true;
    bigHeader: true;
    sleekHeader: true;
    bigText: true;
    graphHeader: true;

    sectionHeader: true;
    h1: false;
    h2: false;
    h3: false;
    h4: false;
    h5: false;
    h6: false;
    body1: false;
    body2: false;
    button: false;
    caption: false;
    overline: false;
  }
}

export const getTheme = createTheme(scrollbarTheme, {
  palette: {
    primary: {
      main: '#123882',
    },
    secondary: {
      main: '#151E23',
    },
    error: {
      main: '#DC2F2F',
    },
    warning: {
      main: '#E77823',
    },
    success: {
      main: '#00BA70',
    },
    info: {
      main: '#123882',
    },
    action: {
      active: '#F5F5F5',
      selected: '#000000',
      disabled: ' ',
      disabledBackground: '#123882',
      focus: 'inherit', // @note ugly bugfix
      hover: '#F5F5F5',
    },
    // background: {
    //   default: '#151d21',
    //   paper: '#1f282d',
    // },
    // text: {
    //   primary: '#F5F5F5',
    //   disabled: '#808B8B',
    //   secondary: '#7297AC',
    // },
  },
  typography: {
    // tableText: {
    //   fontFamily: 'Calibri',
    //   fontSize: '16px',
    //   color: '#D5D5D5',
    // },
    // highlightText: {
    //   fontFamily: 'Calibri',
    //   fontSize: '16px',
    //   fontWeight: 'bold',
    //   color: '#D5D5D5',
    // },
    // columnHeader: {
    //   fontFamily: 'Calibri Light',
    //   fontSize: '16px',
    //   fontStyle: 'italic',
    //   color: '#7297AC',
    // },
    // columnHighlight: {
    //   fontFamily: 'Calibri Light',
    //   fontSize: '16px',
    //   fontWeight: 'bold',
    //   color: '#7297AC',
    // },
    // bigHeader: {
    //   fontFamily: 'Calibri',
    //   fontSize: '30px',
    //   fontWeight: 'bold',
    //   color: '#F5F5F5',
    // },
    // sleekHeader: {
    //   fontFamily: 'Calibri Light',
    //   fontSize: '30px',
    //   color: '#D5D5D5',
    // },
    bigText: {
      fontFamily: 'Arial',
      fontSize: '50px',
      fontWeight: 'bold',
      color: '#F5F5F5',
    },
  },
  components: {
    // MuiTypography: {
    //   styleOverrides: {
    //     root: {
    //       cursor: 'default',
    //     },
    //   },
    // },
    // MuiTabs: {
    //   styleOverrides: {
    //     indicator: {
    //       backgroundColor: '#00A3FF',
    //       height: 2,
    //     },
    //   },
    // },
    // MuiTab: {
    //   styleOverrides: {
    //     root: {
    //       backgroundColor: '#1F282D',
    //       borderTopLeftRadius: 10,
    //       borderTopRightRadius: 10,
    //       marginRight: 10,
    //       overflow: 'hidden',
    //       textTransform: 'capitalize',
    //     },
    //   },
    // },
    // MuiCircularProgress: {
    //   styleOverrides: {
    //     colorPrimary: {
    //       color: '#00A3FF',
    //     },
    //   },
    // },
    // MuiButton: {
    //   styleOverrides: {
    //     outlined: {
    //       backgroundColor: '#2B3338',
    //       border: '2px #00A3FF solid',
    //       textTransform: 'none',
    //       '&:hover': {
    //         backgroundColor: '#00A3FF',
    //         border: '2px #00A3FF solid',
    //       },
    //     },
    //   },
    // },
  },
});

export const WIDTH_OF_INFO_COMPONENT = 440;
export const COMPONENT_PADDING = 24;

type createSxParams = {
  tinySx?: MuiSxProps;
  smallSx?: MuiSxProps;
  mediumSx?: MuiSxProps;
  largeSx?: MuiSxProps;
};

export function createSx(theme: Theme, { tinySx, smallSx, mediumSx, largeSx }: createSxParams): MuiSxProps {
  return {
    // prefer the large setting, but fall back to smaller settings if they were given
    [theme.breakpoints.only('xl')]: {
      ...tinySx,
      ...smallSx,
      ...mediumSx,
      ...largeSx,
    },
    // for all the smaller settings: use it if it's given, but fall back to the larger settings otherwise
    [theme.breakpoints.only('lg')]: {
      ...largeSx,
      ...mediumSx,
    },
    [theme.breakpoints.only('md')]: {
      ...largeSx,
      ...mediumSx,
      ...smallSx,
    },
    [theme.breakpoints.down('md')]: {
      ...largeSx,
      ...mediumSx,
      ...smallSx,
      ...tinySx,
    },
    // @note it may be possible to write this cleaner, but this will do for now / jespo 2021-12-08
  };
}
