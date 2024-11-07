//
import React from "react";
//
// import { makeStyles } from "@material-ui/core/styles";
//
// import Dialog from "@material-ui/core/Dialog";
// import Button from "@material-ui/core/Button";
// import p from "@material-ui/core/p";
// import Update from "@material-ui/icons/Update";
// //
// import Slide from "@material-ui/core/Slide";

import { useSw } from "./SwProvider";
import { Button, Modal } from "react-bootstrap";
import { ArrowCounterclockwise } from "react-bootstrap-icons";

// const useStyles = makeStyles((theme) => ({
//   box: {
//     display: "flex",
//     flex: 1,
//     flexDirection: "column",
//     backgroundColor: "#FFF",
//     paddingTop: 150,
//     alignItems: "center",
//   },
//   btnUpdate: {
//     marginTop: 40,
//     backgroundColor: "#F26722",
//     fontFamily: "Glacial Indifference",
//     textTransform: "capitalize",
//     width: 150,
//     borderRadius: 5,
//     "&:hover": {
//       backgroundColor: "#FFA79C",
//     },
//   },
//   title: {
//     fontSize: 25,
//     fontWeight: "bold",
//     textAlign: "center",
//     color: "#4F4F4F",
//     fontFamily: "Glacial Indifference",
//     margin: "20px auto"
//   },
//   subtitle: {
//     maxWidth: 245,
//     fontSize: 12,
//     fontWeight: 400,
//     textAlign: "center",
//     color: "#4F4F4F",
//     fontFamily: "Glacial Indifference",
//   },
//   ico: {
//     fontSize: 50,
//     color: "#F26722"
//   }
// }));

// const Transition = React.forwardRef(function Transition(props, ref) {
//   return <Slide direction="up" ref={ref} {...props} />;
// });

export default function FullScreenDialog() {
  // const classes = useStyles();
  const [open, setOpen] = React.useState(false);

  const { isUpdateAvailable, updateAssets } = useSw();

  React.useEffect(() => {
    if (isUpdateAvailable) {
      setOpen(true);
    }
  }, [isUpdateAvailable]);
  console.log('isUpdate=>', isUpdateAvailable)
  return (
    <React.Fragment>
      <Modal
        size='lg'
        style={{
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          width: 'auto',
          height: 'auto',
          overFlowY: 'auto'
        }}
        scrollable={true}
        // {...props}
        show={open}
        // onHide={() => {
        //   props?.onHide();
        //   // setLoading(true);

        // }}
        backdrop="static"
        keyboard={false}
      >

        <div className="d-flex flex-column align-items-center justify-content-center h-100">
          <ArrowCounterclockwise color="primary" size={50} className="mb-3" />
          <p className="h4">Pembaruan Tersedia</p>
          <p className="text-muted text-center mb-4">
            Klik tombol di bawah untuk memuat ulang aplikasi dengan update terbaru
          </p>
          <Button
            onClick={updateAssets}
            variant="primary"
            size="lg"
            className="px-4"
          >
            Muat Ulang
          </Button>
        </div>
      </Modal>
    </React.Fragment>
  );
}
