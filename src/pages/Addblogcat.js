import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import { db } from "./firebaase.js";

const Addblogcat = () => {
  const [selectedImage, setSelectedImage] = useState(null); // Track selected image
  const [galleryImages, setGalleryImages] = useState([]);   // Store gallery images
  const [title, setTitle] = useState("");

  // Fetch all gallery images on component mount
  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        const imagesSnapshot = await db.collection('gallery').get();
        const images = imagesSnapshot.docs.map(doc => ({
          id: doc.id,
          url: doc.data().url,
        }));
        setGalleryImages(images);
      } catch (error) {
        console.error("Error fetching gallery images: ", error);
      }
    };

    fetchGalleryImages();
  }, []);

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file)); // Generate image URL for preview
    }
  };

  // Handle form submission to upload the image
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedImage) {
      toast.error("Please select an image to upload.");
      return;
    }

    const file = e.target.querySelector('input[type="file"]').files[0];
    const storageRef = firebase.storage().ref();
    const galleryImageRef = storageRef.child(`gallery/${file.name}_${Date.now()}`);

    try {
      // Upload the image
      await galleryImageRef.put(file);

      // Get the download URL
      const downloadURL = await galleryImageRef.getDownloadURL();

      // Add the new image document to Firestore
      const newImageDoc = await db.collection('gallery').add({
        loc: title,
        url: downloadURL
      });

      // Update the state to display the new image in the gallery
      setGalleryImages((prevImages) => [...prevImages, { id: newImageDoc.id, url: downloadURL }]);
      setSelectedImage(null); // Clear selected image preview
      setTitle("");
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading image: ", error);
      toast.error("Failed to upload image.");
    }
  };

  // Handle delete image
  const handleDelete = async (imageId, imageUrl) => {
    try {
      // Find the reference for the image in Firebase Storage
      const storageRef = firebase.storage().refFromURL(imageUrl);

      // Delete the image from Firebase Storage
      await storageRef.delete();

      // Delete the document from Firestore
      await db.collection('gallery').doc(imageId).delete();

      // Update local state to remove the deleted image
      setGalleryImages((prevImages) =>
        prevImages.filter((image) => image.id !== imageId)
      );

      toast.success("Image deleted successfully!");
    } catch (error) {
      console.error("Error deleting image: ", error);
      toast.error("Failed to delete image.");
    }
  };

  return (
    <div>
      <h3 className="mb-4 title">Add Gallery Photo</h3>
      <div>
        <form onSubmit={handleSubmit}>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />

          <label>Location</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Location"
          />

          {/* Display selected image as a preview */}
          {selectedImage && (
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <h4>Selected Image:</h4>
              <img
                src={selectedImage}
                alt="Selected Preview"
                style={{ width: 200, height: 200, objectFit: 'cover' }}
              />
            </div>
          )}

          <button
            className="btn btn-success border-0 rounded-3 my-5"
            type="submit"
          >
            Add
          </button>
        </form>

        {/* Display gallery images */}
        <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: '2%', gap: 10 }}>
          {galleryImages.map((image) => (
            <div key={image.id} style={{ position: 'relative' }}>
              <img
                src={image.url}
                alt="Gallery"
                style={{ width: 200, height: 200, objectFit: 'cover' }}
              />
              {/* Delete Button */}
              <button
                onClick={() => handleDelete(image.id, image.url)}
                style={{
                  position: 'absolute',
                  top: 5,
                  right: 5,
                  background: 'red',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  width: 25,
                  height: 25,
                  textAlign: 'center',
                  lineHeight: '25px',
                  fontSize: 14,
                }}
              >
                X
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Addblogcat;
