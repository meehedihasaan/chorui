import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import cn from 'clsx';
import { useUser } from '@lib/context/user-context';
import { useRouter } from '@lib/router';
import { useModal } from '@lib/hooks/useModal';
import {
  checkUsernameAvailability,
  updateUserData,
  uploadImages
} from '@lib/firebase/utils';
import { DEFAULT_AVATAR_URL } from '@lib/default-avatar';
import { getImagesData } from '@lib/validation';
import {
  getUsernameError,
  isUsernameUnchanged,
  normalizeUsername
} from '@lib/username';
import { Modal, backdrop } from '@components/modal/modal';
import { EditProfileModal } from '@components/modal/edit-profile-modal';
import { Button } from '@components/ui/button';
import { InputField } from '@components/input/input-field';
import type { ChangeEvent, KeyboardEvent } from 'react';
import type { FilesWithId } from '@lib/types/file';
import type { User, EditableData, EditableUserData } from '@lib/types/user';
import type { InputFieldProps } from '@components/input/input-field';

type RequiredInputFieldProps = Omit<InputFieldProps, 'handleChange'> & {
  inputId: EditableData;
};

type UserImages = Record<
  Extract<EditableData, 'photoURL' | 'coverPhotoURL'>,
  FilesWithId
>;

type TrimmedTexts = Pick<
  EditableUserData,
  Exclude<EditableData, 'photoURL' | 'coverPhotoURL'>
>;

type UserEditProfileProps = {
  hide?: boolean;
};

export function UserEditProfile({ hide }: UserEditProfileProps): JSX.Element {
  const { user } = useUser();
  const { open, openModal, closeModal } = useModal();
  const { asPath, replace } = useRouter();

  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameHint, setUsernameHint] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);

  const { bio, name, website, location, photoURL, coverPhotoURL, username } =
    user as User;

  const [editUserData, setEditUserData] = useState<EditableUserData>({
    bio,
    name,
    website,
    photoURL,
    location,
    coverPhotoURL,
    username
  });

  const [userImages, setUserImages] = useState<UserImages>({
    photoURL: [],
    coverPhotoURL: []
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => cleanImage, []);

  // Validate the typed handle and, once it looks usable, ask the database
  // whether somebody else already holds it.
  useEffect(() => {
    const value = normalizeUsername(editUserData.username);

    if (isUsernameUnchanged(username, value)) {
      setUsernameError('');
      setUsernameHint(
        value ? `@${value} is your current handle.` : 'Handles are 4-15 characters.'
      );
      setCheckingUsername(false);
      return;
    }

    const invalid = getUsernameError(username, value);

    if (invalid) {
      setUsernameError(invalid);
      setUsernameHint('');
      setCheckingUsername(false);
      return;
    }

    let cancelled = false;

    setCheckingUsername(true);
    setUsernameHint(`Checking @${value}…`);

    const timer = setTimeout(async () => {
      const available = await checkUsernameAvailability(value);

      if (cancelled) return;

      setCheckingUsername(false);

      if (available) {
        setUsernameError('');
        setUsernameHint(`@${value} is available.`);
      } else {
        setUsernameError('This username has been taken. Please choose another.');
        setUsernameHint('');
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [editUserData.username, username]);

  const inputNameError = !editUserData.name?.trim()
    ? "Name can't be blank"
    : '';

  const updateData = async (): Promise<void> => {
    if (loading || !user) return;
    setLoading(true);
    try {

    const userId = user?.id as string;

    const newUsername = normalizeUsername(editUserData.username);
    const usernameChanged = !isUsernameUnchanged(username, newUsername);

    if (usernameChanged) {
      const invalid = getUsernameError(username, newUsername);

      if (invalid) throw new Error(invalid);

      if (!(await checkUsernameAvailability(newUsername)))
        throw new Error('This username has been taken. Please choose another.');
    }

    const { photoURL, coverPhotoURL: coverURL } = userImages;

    const [newPhotoURL, newCoverPhotoURL] = await Promise.all(
      [photoURL, coverURL].map((image) => uploadImages(userId, image))
    );

    const newImages: Partial<Pick<User, 'photoURL' | 'coverPhotoURL'>> = {
      coverPhotoURL:
        coverPhotoURL === editUserData.coverPhotoURL
          ? coverPhotoURL
          : newCoverPhotoURL?.[0].src ?? null,
      ...(newPhotoURL && { photoURL: newPhotoURL[0].src })
    };

    const trimmedKeys: Readonly<EditableData[]> = [
      'name',
      'bio',
      'location',
      'website',
      'username'
    ];

    const trimmedTexts = trimmedKeys.reduce(
      (acc, curr) => ({ ...acc, [curr]: editUserData[curr]?.trim() ?? null }),
      {} as TrimmedTexts
    );

    const newUserData: Readonly<EditableUserData> = {
      ...editUserData,
      ...trimmedTexts,
      ...(usernameChanged && { username: newUsername }),
      ...newImages
    };

    await updateUserData(userId, newUserData);

    closeModal();

    cleanImage();

    setLoading(false);
    setEditUserData(newUserData);

    // The profile address is built from the handle, so follow the new one.
    if (usernameChanged)
      replace(asPath.replace(/\/user\/[^/?#]+/i, `/user/${newUsername}`));

    toast.success('Profile updated successfully');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not save your profile.'); }
    finally { setLoading(false); }
  };

  const editImage =
    (type: 'cover' | 'profile') =>
    ({ target: { files } }: ChangeEvent<HTMLInputElement>): void => {
      const imagesData = getImagesData(files);

      if (!imagesData) {
        toast.error('Please choose a valid GIF or Photo');
        return;
      }

      const { imagesPreviewData, selectedImagesData } = imagesData;

      const targetKey = type === 'cover' ? 'coverPhotoURL' : 'photoURL';
      const newImage = imagesPreviewData[0].src;

      setEditUserData({
        ...editUserData,
        [targetKey]: newImage
      });

      setUserImages({
        ...userImages,
        [targetKey]: selectedImagesData
      });
    };

  const removeCoverImage = (): void => {
    setEditUserData({
      ...editUserData,
      coverPhotoURL: null
    });

    setUserImages({
      ...userImages,
      coverPhotoURL: []
    });

    URL.revokeObjectURL(editUserData.coverPhotoURL ?? '');
  };

  const removeProfileImage = (): void => {
    if (editUserData.photoURL?.startsWith('blob:')) URL.revokeObjectURL(editUserData.photoURL);
    setEditUserData(current => ({ ...current, photoURL: DEFAULT_AVATAR_URL }));
    setUserImages(current => ({ ...current, photoURL: [] }));
  };

  const cleanImage = (): void => {
    const imagesKey: Readonly<Partial<EditableData>[]> = [
      'photoURL',
      'coverPhotoURL'
    ];

    imagesKey.forEach((image) =>
      URL.revokeObjectURL(editUserData[image] ?? '')
    );

    setUserImages({
      photoURL: [],
      coverPhotoURL: []
    });
  };

  const resetUserEditData = (): void => {
    cleanImage();
    setEditUserData({
      bio,
      name,
      website,
      photoURL,
      location,
      coverPhotoURL,
      username
    });
  };

  const handleChange =
    (key: EditableData) =>
    ({
      target: { value }
    }: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setEditUserData({ ...editUserData, [key]: value });

  const handleKeyboardShortcut = ({
    key,
    target,
    ctrlKey
  }: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    if (
      ctrlKey &&
      key === 'Enter' &&
      !inputNameError &&
      !usernameError &&
      !checkingUsername
    ) {
      (target as HTMLInputElement).blur();
      void updateData();
    }
  };

  const inputFields: Readonly<RequiredInputFieldProps[]> = [
    {
      label: 'Name',
      inputId: 'name',
      inputValue: editUserData.name,
      inputLimit: 50,
      errorMessage: inputNameError
    },
    {
      label: 'Username',
      inputId: 'username',
      inputValue: editUserData.username,
      inputLimit: 15,
      hint: usernameHint,
      errorMessage: usernameError
    },
    {
      label: 'Bio',
      inputId: 'bio',
      inputValue: editUserData.bio,
      inputLimit: 160,
      useTextArea: true
    },
    {
      label: 'Location',
      inputId: 'location',
      inputValue: editUserData.location,
      inputLimit: 30
    },
    {
      label: 'Website',
      inputId: 'website',
      inputValue: editUserData.website,
      inputLimit: 100
    }
  ];

  return (
    <form className={cn(hide && 'hidden md:block')}>
      <Modal
        className='flex items-stretch p-0 overflow-hidden'
        modalClassName='relative flex h-dvh w-full flex-col overflow-hidden bg-main-background'
        modalAnimation={backdrop}
        open={open}
        closeModal={closeModal}
      >
        <EditProfileModal
          name={name}
          loading={loading}
          photoURL={editUserData.photoURL}
          coverPhotoURL={editUserData.coverPhotoURL}
          inputNameError={inputNameError}
          saveDisabled={!!usernameError || checkingUsername}
          editImage={editImage}
          closeModal={closeModal}
          updateData={updateData}
          removeCoverImage={removeCoverImage}
          removeProfileImage={removeProfileImage}
          resetUserEditData={resetUserEditData}
        >
          {inputFields.map((inputData) => (
            <InputField
              {...inputData}
              handleChange={handleChange(inputData.inputId)}
              handleKeyboardShortcut={handleKeyboardShortcut}
              key={inputData.inputId}
            />
          ))}
        </EditProfileModal>
      </Modal>
      <Button
        className='btn-mint self-start px-4 py-1.5'
        onClick={openModal}
      >
        Edit profile
      </Button>
    </form>
  );
}
