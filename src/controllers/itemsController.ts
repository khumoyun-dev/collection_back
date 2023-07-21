import { Response, Request } from 'express';
import { ObjectId } from 'mongodb';
import { validationResult } from 'express-validator';

import Item from '../models/item';

import { handleItemDelete } from '../utils/deletionHandlers';
import { handleItemCreation } from '../utils/creationHandlers';

const getAllItems = async (request: Request, response: Response) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    response.json(items);
  } catch (error) {
    throw new Error(`${error}`);
  }
};

const getItemById = async (request: Request, response: Response) => {
  try {
    const itemId = new ObjectId(request.params.itemId);
    const item = await Item.findById(itemId);
    response.json(item);
  } catch (error) {
    throw new Error(`${error}`);
  }
};

const getItemsByCollectionId = async (request: Request, response: Response) => {
  try {
    const collectionId = new ObjectId(request.params.collectionId);
    const itemsInCollection = await Item.find({
      collectionId: {
        $all: collectionId,
      },
    }).sort({ createdAt: -1 });
    return response.json(itemsInCollection);
  } catch (error) {
    throw new Error(`${error}`);
  }
};

const createItem = async (request: Request, response: Response) => {  
  try {
    const validationErrors = validationResult(request);
    if (!validationErrors.isEmpty()) {
      return response.status(400).json({ message: 'Creation error', validationErrors });
    }
    const {
      collectionId,
      collectionName,
      collectionTheme,
      ownerId,
      ownerName,
      itemName,
      itemImage,
      customFields,
    } = request.body;
    const newItem = new Item({
      collectionId,
      collectionName,
      collectionTheme,
      ownerId,
      ownerName,
      itemName,
      itemImage:
        itemImage ||
        `https://source.boringavatars.com/marble/120/${itemName}%20${ownerId}?colors=F97D58,CDDCEB,F9DBCF,33B99,5D70C5&square`,
      likes: [],
      customFields: customFields || [],
    });
    await handleItemCreation(newItem.collectionId);
    await newItem.save();
    return response.json(newItem);
  } catch (error) {
    response.status(400).json({ message: 'Unexpected creation error' });
    throw new Error(`${error}`);
  }
};

const deleteItem = async (request: Request, response: Response) => {
  try {
    const itemId = new ObjectId(request.params.itemId);
    const deletedItem = await Item.findByIdAndDelete(itemId);
    if (deletedItem) {
      await handleItemDelete(itemId, deletedItem.collectionId);
    }
    response.json(deletedItem);
  } catch (error) {
    throw new Error(`${error}`);
  }
};

const updateItem = async (request: Request, response: Response) => {
  try {
    const itemId = new ObjectId(request.params.itemId);
    const updatedItem = await Item.findByIdAndUpdate(itemId, request.body, {
      new: true,
    });
    response.json(updatedItem);
  } catch (error) {
    throw new Error(`${error}`);
  }
};

export {
  getAllItems,
  getItemById,
  getItemsByCollectionId,
  createItem,
  deleteItem,
  updateItem,
};
