package com.echospace.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.echospace.model.commons.User;

@Mapper
public interface UserMapper {

    User findUserByUsernameOrEmail(@Param("identifier") String identifier);

    User findUserById(@Param("id") String identifier);

    /**
     * insert a user entry, returning what is inserted in the database with the
     * generated values
     * 
     * @param user
     * @return
     */
    User insertUser(User user);

    User updateUserProfile(User user);
}
