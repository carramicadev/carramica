import React from "react";
import { OverlayTrigger, Popover, ListGroup, Button } from "react-bootstrap";
import { Eye, JournalPlus } from "react-bootstrap-icons";

const ListContent = () => {
  return (
    <ListGroup variant="flush">
      <ListGroup.Item action onClick={() => alert("Item 1 clicked!")}>
        <Eye size={20} /> Lihat Invoice
      </ListGroup.Item>
      <ListGroup.Item action onClick={() => alert("Item 2 clicked!")}>
        <JournalPlus size={20} /> Buat kuitansi Penjualan
      </ListGroup.Item>
      {/* <ListGroup.Item action onClick={() => alert("Item 3 clicked!")}>
        Item 3
      </ListGroup.Item> */}
    </ListGroup>
  );
};

const PopoverListExample = () => {
  const popover = (
    <Popover id="popover-list">
      {/* <Popover.Header as="h3">My List</Popover.Header> */}
      <Popover.Body>
        <ListContent />
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger
      trigger="click" // can also be ['hover', 'focus']
      placement="right-start"
      overlay={popover}
      rootClose
    >
      <Button variant="primary">Open List Popover</Button>
    </OverlayTrigger>
  );
};

export default PopoverListExample;
