import { React, useEffect, useState } from "react";
import CustomInput from "../components/CustomInput.js";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Dropzone from "react-dropzone";
import { delImg, uploadImg } from "../features/upload/uploadSlice.js";
import { toast } from "react-toastify";
import * as yup from "yup";
import { useFormik } from "formik";
import { db } from "./firebaase.js";
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';

let schema = yup.object().shape({
  title: yup.string().required("Title is Required"),
  description: yup.string().required("Description is Required"),
  category: yup.string().required("Category is Required"),
});

const AddSlider = () => {
  const [categories, setCategories] = useState([]);
  const [products, setproducts] = useState([]);
  const [productPhotos, setProductPhotos] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [category, setcategory] = useState('');

  const handleCategoryChange =(e) =>{
    setcategory(e.target.value);
  }

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snapshot = await db.collection('categories').get();
        const categoryData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategories(categoryData);
      } catch (error) {
        console.error('Error fetching categories: ', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snapshot = await db.collection('categories').doc(category).collection("products").get();
        const productData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setproducts(productData);
      } catch (error) {
        console.error('Error fetching Products: ', error);
      }
    };
    fetchProducts();
  }, [category]);

  const handleFileChange = (e, index) => {
    const files = e.target.files;
    setProductPhotos(files[0]);
  }


const formik = useFormik({
  enableReinitialize: true,
  initialValues: {
    title: "",
    description: "",
    product: "",
    images: "",
  },
  validationSchema: schema,

});

const handleFormSubmit = async (e) => {
  e.preventDefault();

  if (!productPhotos) {
    toast.error("Please Upload A Photo")
    return;
  }

  try {
    const db = firebase.firestore();
    const storageRef = firebase.storage().ref();
    const sliderRef = db.collection('slider');

    // Create a folder for each product in Firebase Storage
    const productPhotoRef = storageRef.child(`product-photos/${formik.values.title}`);

    // Upload photos to Firebase Storage
    const productPhotoTask = productPhotoRef.put(productPhotos);

    await new Promise((resolve, reject) => {
      productPhotoTask.on(
        'state_changed',
        (snapshot) => {
          // Get the upload progress for the video
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Error uploading video: ', error);
          reject(error);
        },
        async () => {
          // Resolve after the video is successfully uploaded
          resolve();
        }
      );
    });

    // Get the download URL for the video
    const photoURL = await productPhotoRef.getDownloadURL();

    // Add product to Firestore
    await sliderRef.add({
      title: formik.values.title,
      description:formik.values.description,
      photo: photoURL,
      category:category,
      product:formik.values.product,
    });

    // Clear the input fields after successful submission
    setProductPhotos(null);
    setUploadProgress(0);
    toast.success("Slider Added Succesfully")
    console.log('Product added successfully!');
    window.location.reload();
  } catch (error) {
    toast.error('Something was Wromg')
    console.error('Error adding product: ', error);
  }
};



return (
  <div>
    <h3 className="mb-4 title">
      Add A Slider
    </h3>

    <div className="">
      <form action="" onSubmit={formik.handleSubmit}>
        <div className="mt-4">
          <CustomInput
            type="text"
            label="Enter Blog Title"
            name="title"
            onChng={formik.handleChange("title")}
            onBlr={formik.handleBlur("title")}
            val={formik.values.title}
          />
        </div>
        <div className="error">
          {formik.touched.title && formik.errors.title}
        </div>

        <select
          name="category"
          onChange={handleCategoryChange}
          onBlur={formik.handleBlur("category")}
          value={category}
          className="form-control py-3  mt-3"
          id=""
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          name="product"
          onChange={formik.handleChange("product")}
          onBlur={formik.handleBlur("product")}
          value={formik.values.product}
          className="form-control py-3  mt-3"
          id=""
        >
          <option value="">Select a Product</option>
          {products.map((category) => (
            <option key={category.id} value={category.id}>
              {category.title}
            </option>
          ))}
        </select>

        <div className="error">
          {formik.touched.product && formik.errors.product}
        </div>
        <ReactQuill
          theme="snow"
          className="mt-3"
          name="description"
          onChange={formik.handleChange("description")}
          value={formik.values.description}
        />
        <div className="error">
          {formik.touched.description && formik.errors.description}
        </div>
        <div className="bg-white border-1 p-5 text-center mt-3">
          {/* <Dropzone
            onDrop={(acceptedFiles) => dispatch(uploadImg(acceptedFiles))}
          >
            {({ getRootProps, getInputProps }) => (
              <section>
                <div {...getRootProps()}>
                  <input {...getInputProps()} />
                  <p>
                    Drag 'n' drop some files here, or click to select files
                  </p>
                </div>
              </section>
            )}
          </Dropzone> */}
          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e)} />

        </div>
        <div className="showimages d-flex flex-wrap mt-3 gap-3">

        </div>

        <button
          className="btn btn-success border-0 rounded-3 my-5"
          type="submit"
          onClick={handleFormSubmit}
        >
          submit
        </button>
        <h2>{uploadProgress}</h2>
      </form>
    </div>
  </div >
);
};

export default AddSlider;
