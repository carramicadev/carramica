import { getAuth, sendEmailVerification, updateEmail } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Form, Button, Image } from 'react-bootstrap';
import { PersonCircle } from 'react-bootstrap-icons';
import { useAuth } from '../../AuthContext';
import { firestore } from '../../FirebaseFrovider';

const ProfilePage = (props) => {
    const { currentUser } = useAuth();
    // console.log(props)
    const [profile, setProfile] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfile({ ...profile, [name]: value });
    };

    const handleSave = async () => {
        try {
            await setDoc(doc(firestore, 'users', currentUser?.uid), {
                ...profile
            }, { merge: true })
            // console.log('Saved profile:', profile);
            props?.enqueueSnackbar('Profil berhasil disimpan!.', { variant: 'success' })
        } catch (e) {
            console.log(e.message)
        }
    };
    useEffect(() => {
        async function getUsers() {
            if (currentUser) {
                const docRef = doc(firestore, "users", currentUser?.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setProfile({
                        ...docSnap.data()
                    })
                    // console.log("Document data:", docSnap.data());
                } else {
                    // docSnap.data() will be undefined in this case
                    console.log("No such document!");
                }

            }
        }
        getUsers()
    }, [currentUser]);

    const handleUpdateEmail = async (e) => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (window.confirm(' apakah anda yakin ingin mengubah email?')) {
            try {
                await updateEmail(user, e.target.value);
                await sendEmailVerification(user);
                await setDoc(doc(firestore, 'users', user?.uid), {
                    email: e.target.value
                }, { merge: true })
                props?.enqueueSnackbar('Email updated successfully.', { variant: 'success' });
            } catch (error) {
                let emailError = '';
                switch (e.code) {
                    case 'auth/email-already-in-use':
                        emailError = 'Email sudah diginakan oleh pengguna lain';
                        break;
                    case 'auth/invalid-email':
                        emailError = 'Email tidak valid';
                        break;
                    case 'auth/requires-recent-login':
                        emailError = 'Silahkan logout kemudian login kembali untuk memperbaharui email';
                        break;

                }
                props?.enqueueSnackbar(`Email updated failed. ${emailError}`, { variant: 'error' });

            }

        } else {

        }

    };
    // console.log(profile)
    return (
        <><Row>
            <Col sm={5} className="text-center">
                <Image
                    src="./user-icon.svg"
                    roundedCircle
                    alt="Profile"
                    width={150}
                    height={150} />
                {/* <PersonCircle size={150} color='#3D5E54' /> */}
                <h3>{profile.firstName} {profile.lastName}</h3>
                <p>Admin</p>
            </Col>
            <Col sm={7}>
                <h2>Basic Info</h2>
                <Form>
                    <Form.Group as={Row} controlId="formFirstName">
                        <Col sm={6}>
                            <Form.Label >First Name</Form.Label>

                            <Form.Control
                                type="text"
                                name="firstName"
                                value={profile.firstName}
                                onChange={handleInputChange} />
                        </Col>
                        <Col sm={6}>
                            <Form.Label >Last Name</Form.Label>

                            <Form.Control
                                type="text"
                                name="lastName"
                                value={profile.lastName}
                                onChange={handleInputChange} />
                        </Col>
                    </Form.Group>

                    {/* <Form.Group as={Row} controlId="formLastName">

                    </Form.Group> */}

                    <Form.Group as={Row} controlId="formPhone">
                        <Col sm={12}>
                            <Form.Label >Phone</Form.Label>

                            <Form.Control
                                type="text"
                                name="phone"
                                value={profile.phone}
                                onChange={handleInputChange} />
                        </Col>
                    </Form.Group>

                    <Form.Group as={Row} controlId="formEmail">
                        <Col sm={12}>
                            <Form.Label >Email</Form.Label>

                            <Form.Control
                                type="email"
                                name="email"
                                value={profile.email}
                                onChange={handleInputChange}
                                onBlur={handleUpdateEmail}
                            />
                        </Col>
                    </Form.Group>

                    <Button style={{ backgroundColor: '#3D5E54', border: 'none', width: '100%' }} color='#3D5E54' onClick={handleSave}>
                        Save
                    </Button>
                </Form>
            </Col>
        </Row></>
    );
};

export default ProfilePage;
