import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';

export const LogoutDialog = ({ show, handleClose, handleLogout }) => {
    return (
        <Modal style={{
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            width: 'auto',
            height: 'auto',
            overFlowY: 'auto'
        }} show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Confirm Logout</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                Are you sure you want to log out?
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Cancel
                </Button>
                <Button variant="danger" onClick={handleLogout}>
                    Logout
                </Button>
            </Modal.Footer>
        </Modal>
    );
};