// Example using React (assuming you have React Router)
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AcceptInvitation = () => {
    const { projectID, token } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const acceptInvitation = async () => {
            try {
                const response = await axios.put(`http://localhost:3000/project/accept-invitation/${projectID}/${token}`); 
                console.log(response.data.message);
                alert(response.data.message);
                navigate('/'); 
            } catch (error) {
                console.error("Error accepting invitation:", error);
                const errorMessage = error.response?.data?.message || 'Failed to accept invitation. Please try again or contact support.';
                alert(errorMessage);
                navigate('/');
            }
        };

        if (projectID && token) {
            acceptInvitation();
        } else {
            console.error("Missing projectID or token in URL.");
            alert("Invalid invitation link.");
            navigate('/'); 
        }
    }, [projectID, token, navigate]); 

    return (
        <div>
            <h1>Accepting Invitation...</h1>
            <p>Please wait while we process your invitation.</p>
        </div>
    );
};

export default AcceptInvitation;