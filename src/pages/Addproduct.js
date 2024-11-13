import { React, useEffect, useState } from "react";
import CustomInput from "../components/CustomInput";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { toast } from "react-toastify";
import * as yup from "yup";
import { useFormik } from "formik";
import { useDispatch, useSelector } from "react-redux";
import Dropzone from "react-dropzone";
import { createProducts, resetState } from "../features/product/productSlice";
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import { db } from "./firebaase.js";
import './css/Addproduct.css';


let schema = yup.object().shape({
  title: yup.string().required("Title is Required"),
  description: yup.string().required("Description is Required"),
  price: yup.number().required("Price is Required"),
  category: yup.string().required("Category is Required"),

});

const Addproduct = () => {
  const dispatch = useDispatch();
  const newProduct = useSelector((state) => state.product);
  const { isSuccess, isError, isLoading, createdProduct } = newProduct;
  const [productPhotos, setProductPhotos] = useState(new Array(5).fill(null));
  const [categories, setCategories] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [productSpecifications, setProductSpecifications] = useState('');


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
    if (isSuccess && createdProduct) {
      toast.success("Product Added Successfullly!");
    }
    if (isError) {
      toast.error("Something Went Wrong!");
    }
  }, [isSuccess, isError, isLoading]);




  const formik = useFormik({
    initialValues: {
      title: "",
      description: "",
      price: "",
      category: "",
      productVideo: "",
    },
    validationSchema: schema,
    onSubmit: (values) => {

      dispatch(createProducts(values));
      formik.resetForm();
      setTimeout(() => {
        dispatch(resetState());
      }, 3000);
    },
  });

  const handleSpecificationsChange = (e) => {
    setProductSpecifications(e.target.value);
  };

  const handleFileChange = (e, index) => {
    const files = e.target.files;
    if (index >= 0 && index < 5) {
      const photosArray = [...productPhotos];
      photosArray[index] = files[0];
      setProductPhotos(photosArray);
    }
  };


  const handleFormSubmit = async (e) => {
    e.preventDefault();
  
    // Ensure all required fields have values
    const { title, description, price, category, productVideo } = formik.values;
    if (!title || !description || !price || !category || productPhotos.every(photo => photo === null)) {
      console.error('Please fill in all required fields and upload at least one photo.');
      toast.error('Please fill in all required fields and upload at least one photo.');
      return;
    }
  
    try {
      const db = firebase.firestore();
      const storageRef = firebase.storage().ref();
      const categoryRef = db.collection('categories').doc(category);
      const productRef = categoryRef.collection('products');
  
      const productSnapshot = await categoryRef.collection('products').get();
      const productCount = productSnapshot.size + 1;
      const productId = `Product${productCount}`;
  
      const photoURLs = [];
  
      // Upload each photo
      for (let index = 0; index < productPhotos.length; index++) {
        const photo = productPhotos[index];
        if (photo) {
          const photoRef = storageRef.child(`product-photos/${productId}/photo${index + 1}`);
          const uploadTaskSnapshot = await photoRef.put(photo);
          const downloadURL = await uploadTaskSnapshot.ref.getDownloadURL();
          photoURLs.push(downloadURL);
        }
      }
  
      // Ensure specifications are in the correct format
      const specificationsArray = productSpecifications
        .split('\n')
        .map((specification) => {
          const [name, value] = specification.split(':').map((item) => item.trim());
          return { name: name || '', value: value || '' };
        });
  
      // Add product to Firestore, ensuring no undefined fields
      await productRef.add({
        title: title || '',
        description: description || '',
        price: parseFloat(price) || 0,
        category: category || '',
        photos: photoURLs,
        videoURL: productVideo || '',
        specifications: specificationsArray,
      });
  
      // Reset form after successful submission
      setProductPhotos(new Array(5).fill(null));
      setUploadProgress(0);
      toast.success("Product Added Successfully!");
      
      // Dispatch the Redux action to add product if needed
      dispatch(createProducts(formik.values));
      
    } catch (error) {
      console.error('Error adding product: ', error);
      toast.error("Failed to add product!");
    }
  };
  
  

  return (
    <div>
      <h3 className="mb-4 title">Add Product</h3>
      <div>
        <form
          onSubmit={handleFormSubmit}
          className="d-flex gap-3 flex-column"
        >
        <span >Title : </span>
          <CustomInput
            type="text"
            name="title"
            onChng={formik.handleChange("title")}
            onBlr={formik.handleBlur("title")}
            val={formik.values.title}
            className="form-control mt-0"
          />
          <div className="error">
            {formik.touched.title && formik.errors.title}
          </div>
          <div className="">
          <span>Description : </span>
            <ReactQuill
              theme="snow"
              name="description"
              onChange={formik.handleChange("description")}
              value={formik.values.description}
              
            />
          </div>
          <div className="error">
            {formik.touched.description && formik.errors.description}
          </div>
          <span>Price : </span>
          <CustomInput
            type="number"
            label="Enter Product Price"
            name="price"
            onChng={formik.handleChange("price")}
            onBlr={formik.handleBlur("price")}
            val={formik.values.price}
          />
          <div className="error">
            {formik.touched.price && formik.errors.price}
          </div>

          <span>Category: </span>
          <select
            name="category"
            onChange={formik.handleChange("category")}
            onBlur={formik.handleBlur("category")}
            value={formik.values.category}
            className="form-control py-3 mb-3"
            id=""
          >
            <option value="" disabled>
              Select Category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <div className="error">
            {formik.touched.tags && formik.errors.tags}
          </div>

          <span>Specification : </span>
          <textarea
            theme="snow"
            name="productSpecifications"
            onChange={handleSpecificationsChange}
            value={productSpecifications}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                setProductSpecifications((prev) => `${prev}\n`);
              }
            }}
            className="form-control"
          />
          <div className="error">
            {formik.touched.productSpecifications && formik.errors.productSpecifications}
          </div>


          {/* [photo] */}
          <span>Product Images : </span>
          <div className="bg-white border-1 p-4 " style={{ display: 'flex' }}>
            {productPhotos.map((photo, index) => (
              <label key={index} style={{ display: 'flex', fontStyle: 'italic',flexDirection: 'column', }}>
                Upload Photo {index + 1}:
                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, index)} />
                {uploadProgress[index] > 0 && <p>Upload Progress: {uploadProgress[index]}%</p>}
              </label>
            ))}
          </div>

          {/* Video  */}
          <span>
            Video link :
          </span> 
           <textarea type="text" required className="form-control" value={formik.values.productVideo} onChange={formik.handleChange("productVideo")} />

          {uploadProgress > 0 && <p>Upload Progress: {uploadProgress}%</p>}

          <button
            className="btn btn-success border-0 rounded-3 my-5"
            type="submit"
          >
            Add Product
          </button>
        </form>
      </div>
    </div>
  );
};

export default Addproduct;
