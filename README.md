Release 1.7
-notifications of staff, head, campus director, and user are all working

Release 1.6
-Automated priority no.
-Contact no. Restrict not starting 09 then 11 digit na sya
-There is notif in staff but it can't still be read
-Onhold, Urgent, verified, completed once done feedback (working)
-Feedback

Release 1.4
backend:
-Api for (facebook or messenger type of red notifs) numbers of notifications:
/notifications/unreadCount
-Function for deny request sets the priority number to null
-Api to set urgent status:
/maintenance-requests/{id}/mark-urgent
-Api to set onhold:
/maintenance-requests/{id}/mark-onhold
-Api to set done:
/maintenance-requests/{id}/mark-done

frontend:
-mark as urgent
-mark as onhold

Release 1.3
-In user POV, details in request status can be seen in text form instead of the ID
-In Campus Director POV, "API cannot be found" error is fixed
-Fixed email notification details in user, head, staff and admin's POV
-Fixed Bug No. 13
-Fixed Bug No. 15
-Fixed Bug No. 18
-Fixed-Email Notification about Admin who will receive email if there is a new account registering
-Fixed-Email Notification about Requester who will receive email if the account registered is approved
-Fixed-Email Notification about Staff who will receive email if there is service request
-Fixed-Email Notification about Head who will receive email if there is service request
-Fixed-Email Notification about Requester who will receive email if service requested is verified by Staff
-Fixed-Email Notification about Head who will receive email if service requested is verified by Staff
-Fixed-Email Notification about Requester who will receive email if service requested is approved/disapproved by Head
-Fixed-Email Notification about Campus Admin who will receive email if service requested is approved/disapproved by Head
-Fixed-Email Notification about Requester who will receive email if service requested already have priority number, done by staff
-Fixed-Campus Admin can now approve after Head

Release 1.2
-Fix admin mobile hamburger menu open
-Fixed Bug No. 1
-Fixed Bug No. 3
-Fixed Bug No. 5
-Fixed Bug No. 6
-Fixed Bug No. 7
-Fixed Bug No. 11
-Fixed Bug No. 12
