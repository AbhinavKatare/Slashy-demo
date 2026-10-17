// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'thread_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$ThreadModel {

 String get id; String get accountId; String get subject; String get snippet; String get lastMessageAt; bool get isUnread; bool get isStarred; int get messageCount; List<ParticipantModel> get participants; List<String> get labelIds; bool get hasAttachments;
/// Create a copy of ThreadModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ThreadModelCopyWith<ThreadModel> get copyWith => _$ThreadModelCopyWithImpl<ThreadModel>(this as ThreadModel, _$identity);

  /// Serializes this ThreadModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ThreadModel&&(identical(other.id, id) || other.id == id)&&(identical(other.accountId, accountId) || other.accountId == accountId)&&(identical(other.subject, subject) || other.subject == subject)&&(identical(other.snippet, snippet) || other.snippet == snippet)&&(identical(other.lastMessageAt, lastMessageAt) || other.lastMessageAt == lastMessageAt)&&(identical(other.isUnread, isUnread) || other.isUnread == isUnread)&&(identical(other.isStarred, isStarred) || other.isStarred == isStarred)&&(identical(other.messageCount, messageCount) || other.messageCount == messageCount)&&const DeepCollectionEquality().equals(other.participants, participants)&&const DeepCollectionEquality().equals(other.labelIds, labelIds)&&(identical(other.hasAttachments, hasAttachments) || other.hasAttachments == hasAttachments));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,accountId,subject,snippet,lastMessageAt,isUnread,isStarred,messageCount,const DeepCollectionEquality().hash(participants),const DeepCollectionEquality().hash(labelIds),hasAttachments);

@override
String toString() {
  return 'ThreadModel(id: $id, accountId: $accountId, subject: $subject, snippet: $snippet, lastMessageAt: $lastMessageAt, isUnread: $isUnread, isStarred: $isStarred, messageCount: $messageCount, participants: $participants, labelIds: $labelIds, hasAttachments: $hasAttachments)';
}


}

/// @nodoc
abstract mixin class $ThreadModelCopyWith<$Res>  {
  factory $ThreadModelCopyWith(ThreadModel value, $Res Function(ThreadModel) _then) = _$ThreadModelCopyWithImpl;
@useResult
$Res call({
 String id, String accountId, String subject, String snippet, String lastMessageAt, bool isUnread, bool isStarred, int messageCount, List<ParticipantModel> participants, List<String> labelIds, bool hasAttachments
});




}
/// @nodoc
class _$ThreadModelCopyWithImpl<$Res>
    implements $ThreadModelCopyWith<$Res> {
  _$ThreadModelCopyWithImpl(this._self, this._then);

  final ThreadModel _self;
  final $Res Function(ThreadModel) _then;

/// Create a copy of ThreadModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? accountId = null,Object? subject = null,Object? snippet = null,Object? lastMessageAt = null,Object? isUnread = null,Object? isStarred = null,Object? messageCount = null,Object? participants = null,Object? labelIds = null,Object? hasAttachments = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,accountId: null == accountId ? _self.accountId : accountId // ignore: cast_nullable_to_non_nullable
as String,subject: null == subject ? _self.subject : subject // ignore: cast_nullable_to_non_nullable
as String,snippet: null == snippet ? _self.snippet : snippet // ignore: cast_nullable_to_non_nullable
as String,lastMessageAt: null == lastMessageAt ? _self.lastMessageAt : lastMessageAt // ignore: cast_nullable_to_non_nullable
as String,isUnread: null == isUnread ? _self.isUnread : isUnread // ignore: cast_nullable_to_non_nullable
as bool,isStarred: null == isStarred ? _self.isStarred : isStarred // ignore: cast_nullable_to_non_nullable
as bool,messageCount: null == messageCount ? _self.messageCount : messageCount // ignore: cast_nullable_to_non_nullable
as int,participants: null == participants ? _self.participants : participants // ignore: cast_nullable_to_non_nullable
as List<ParticipantModel>,labelIds: null == labelIds ? _self.labelIds : labelIds // ignore: cast_nullable_to_non_nullable
as List<String>,hasAttachments: null == hasAttachments ? _self.hasAttachments : hasAttachments // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [ThreadModel].
extension ThreadModelPatterns on ThreadModel {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ThreadModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ThreadModel() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ThreadModel value)  $default,){
final _that = this;
switch (_that) {
case _ThreadModel():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ThreadModel value)?  $default,){
final _that = this;
switch (_that) {
case _ThreadModel() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String accountId,  String subject,  String snippet,  String lastMessageAt,  bool isUnread,  bool isStarred,  int messageCount,  List<ParticipantModel> participants,  List<String> labelIds,  bool hasAttachments)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ThreadModel() when $default != null:
return $default(_that.id,_that.accountId,_that.subject,_that.snippet,_that.lastMessageAt,_that.isUnread,_that.isStarred,_that.messageCount,_that.participants,_that.labelIds,_that.hasAttachments);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String accountId,  String subject,  String snippet,  String lastMessageAt,  bool isUnread,  bool isStarred,  int messageCount,  List<ParticipantModel> participants,  List<String> labelIds,  bool hasAttachments)  $default,) {final _that = this;
switch (_that) {
case _ThreadModel():
return $default(_that.id,_that.accountId,_that.subject,_that.snippet,_that.lastMessageAt,_that.isUnread,_that.isStarred,_that.messageCount,_that.participants,_that.labelIds,_that.hasAttachments);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String accountId,  String subject,  String snippet,  String lastMessageAt,  bool isUnread,  bool isStarred,  int messageCount,  List<ParticipantModel> participants,  List<String> labelIds,  bool hasAttachments)?  $default,) {final _that = this;
switch (_that) {
case _ThreadModel() when $default != null:
return $default(_that.id,_that.accountId,_that.subject,_that.snippet,_that.lastMessageAt,_that.isUnread,_that.isStarred,_that.messageCount,_that.participants,_that.labelIds,_that.hasAttachments);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ThreadModel implements ThreadModel {
  const _ThreadModel({required this.id, required this.accountId, required this.subject, required this.snippet, required this.lastMessageAt, required this.isUnread, required this.isStarred, required this.messageCount, required this.participants, required this.labelIds, this.hasAttachments = false});
  factory _ThreadModel.fromJson(Map<String, dynamic> json) => _$ThreadModelFromJson(json);

@override final  String id;
@override final  String accountId;
@override final  String subject;
@override final  String snippet;
@override final  String lastMessageAt;
@override final  bool isUnread;
@override final  bool isStarred;
@override final  int messageCount;
@override final  List<ParticipantModel> participants;
@override final  List<String> labelIds;
@override@JsonKey() final  bool hasAttachments;

/// Create a copy of ThreadModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ThreadModelCopyWith<_ThreadModel> get copyWith => __$ThreadModelCopyWithImpl<_ThreadModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ThreadModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ThreadModel&&(identical(other.id, id) || other.id == id)&&(identical(other.accountId, accountId) || other.accountId == accountId)&&(identical(other.subject, subject) || other.subject == subject)&&(identical(other.snippet, snippet) || other.snippet == snippet)&&(identical(other.lastMessageAt, lastMessageAt) || other.lastMessageAt == lastMessageAt)&&(identical(other.isUnread, isUnread) || other.isUnread == isUnread)&&(identical(other.isStarred, isStarred) || other.isStarred == isStarred)&&(identical(other.messageCount, messageCount) || other.messageCount == messageCount)&&const DeepCollectionEquality().equals(other.participants, participants)&&const DeepCollectionEquality().equals(other.labelIds, labelIds)&&(identical(other.hasAttachments, hasAttachments) || other.hasAttachments == hasAttachments));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,accountId,subject,snippet,lastMessageAt,isUnread,isStarred,messageCount,const DeepCollectionEquality().hash(participants),const DeepCollectionEquality().hash(labelIds),hasAttachments);

@override
String toString() {
  return 'ThreadModel(id: $id, accountId: $accountId, subject: $subject, snippet: $snippet, lastMessageAt: $lastMessageAt, isUnread: $isUnread, isStarred: $isStarred, messageCount: $messageCount, participants: $participants, labelIds: $labelIds, hasAttachments: $hasAttachments)';
}


}

/// @nodoc
abstract mixin class _$ThreadModelCopyWith<$Res> implements $ThreadModelCopyWith<$Res> {
  factory _$ThreadModelCopyWith(_ThreadModel value, $Res Function(_ThreadModel) _then) = __$ThreadModelCopyWithImpl;
@override @useResult
$Res call({
 String id, String accountId, String subject, String snippet, String lastMessageAt, bool isUnread, bool isStarred, int messageCount, List<ParticipantModel> participants, List<String> labelIds, bool hasAttachments
});




}
/// @nodoc
class __$ThreadModelCopyWithImpl<$Res>
    implements _$ThreadModelCopyWith<$Res> {
  __$ThreadModelCopyWithImpl(this._self, this._then);

  final _ThreadModel _self;
  final $Res Function(_ThreadModel) _then;

/// Create a copy of ThreadModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? accountId = null,Object? subject = null,Object? snippet = null,Object? lastMessageAt = null,Object? isUnread = null,Object? isStarred = null,Object? messageCount = null,Object? participants = null,Object? labelIds = null,Object? hasAttachments = null,}) {
  return _then(_ThreadModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,accountId: null == accountId ? _self.accountId : accountId // ignore: cast_nullable_to_non_nullable
as String,subject: null == subject ? _self.subject : subject // ignore: cast_nullable_to_non_nullable
as String,snippet: null == snippet ? _self.snippet : snippet // ignore: cast_nullable_to_non_nullable
as String,lastMessageAt: null == lastMessageAt ? _self.lastMessageAt : lastMessageAt // ignore: cast_nullable_to_non_nullable
as String,isUnread: null == isUnread ? _self.isUnread : isUnread // ignore: cast_nullable_to_non_nullable
as bool,isStarred: null == isStarred ? _self.isStarred : isStarred // ignore: cast_nullable_to_non_nullable
as bool,messageCount: null == messageCount ? _self.messageCount : messageCount // ignore: cast_nullable_to_non_nullable
as int,participants: null == participants ? _self.participants : participants // ignore: cast_nullable_to_non_nullable
as List<ParticipantModel>,labelIds: null == labelIds ? _self.labelIds : labelIds // ignore: cast_nullable_to_non_nullable
as List<String>,hasAttachments: null == hasAttachments ? _self.hasAttachments : hasAttachments // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}


/// @nodoc
mixin _$ThreadListResponseModel {

 List<ThreadModel> get threads; String? get nextCursor; int get totalCount;
/// Create a copy of ThreadListResponseModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ThreadListResponseModelCopyWith<ThreadListResponseModel> get copyWith => _$ThreadListResponseModelCopyWithImpl<ThreadListResponseModel>(this as ThreadListResponseModel, _$identity);

  /// Serializes this ThreadListResponseModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ThreadListResponseModel&&const DeepCollectionEquality().equals(other.threads, threads)&&(identical(other.nextCursor, nextCursor) || other.nextCursor == nextCursor)&&(identical(other.totalCount, totalCount) || other.totalCount == totalCount));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(threads),nextCursor,totalCount);

@override
String toString() {
  return 'ThreadListResponseModel(threads: $threads, nextCursor: $nextCursor, totalCount: $totalCount)';
}


}

/// @nodoc
abstract mixin class $ThreadListResponseModelCopyWith<$Res>  {
  factory $ThreadListResponseModelCopyWith(ThreadListResponseModel value, $Res Function(ThreadListResponseModel) _then) = _$ThreadListResponseModelCopyWithImpl;
@useResult
$Res call({
 List<ThreadModel> threads, String? nextCursor, int totalCount
});




}
/// @nodoc
class _$ThreadListResponseModelCopyWithImpl<$Res>
    implements $ThreadListResponseModelCopyWith<$Res> {
  _$ThreadListResponseModelCopyWithImpl(this._self, this._then);

  final ThreadListResponseModel _self;
  final $Res Function(ThreadListResponseModel) _then;

/// Create a copy of ThreadListResponseModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? threads = null,Object? nextCursor = freezed,Object? totalCount = null,}) {
  return _then(_self.copyWith(
threads: null == threads ? _self.threads : threads // ignore: cast_nullable_to_non_nullable
as List<ThreadModel>,nextCursor: freezed == nextCursor ? _self.nextCursor : nextCursor // ignore: cast_nullable_to_non_nullable
as String?,totalCount: null == totalCount ? _self.totalCount : totalCount // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [ThreadListResponseModel].
extension ThreadListResponseModelPatterns on ThreadListResponseModel {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ThreadListResponseModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ThreadListResponseModel() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ThreadListResponseModel value)  $default,){
final _that = this;
switch (_that) {
case _ThreadListResponseModel():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ThreadListResponseModel value)?  $default,){
final _that = this;
switch (_that) {
case _ThreadListResponseModel() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( List<ThreadModel> threads,  String? nextCursor,  int totalCount)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ThreadListResponseModel() when $default != null:
return $default(_that.threads,_that.nextCursor,_that.totalCount);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( List<ThreadModel> threads,  String? nextCursor,  int totalCount)  $default,) {final _that = this;
switch (_that) {
case _ThreadListResponseModel():
return $default(_that.threads,_that.nextCursor,_that.totalCount);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( List<ThreadModel> threads,  String? nextCursor,  int totalCount)?  $default,) {final _that = this;
switch (_that) {
case _ThreadListResponseModel() when $default != null:
return $default(_that.threads,_that.nextCursor,_that.totalCount);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ThreadListResponseModel implements ThreadListResponseModel {
  const _ThreadListResponseModel({required this.threads, this.nextCursor, required this.totalCount});
  factory _ThreadListResponseModel.fromJson(Map<String, dynamic> json) => _$ThreadListResponseModelFromJson(json);

@override final  List<ThreadModel> threads;
@override final  String? nextCursor;
@override final  int totalCount;

/// Create a copy of ThreadListResponseModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ThreadListResponseModelCopyWith<_ThreadListResponseModel> get copyWith => __$ThreadListResponseModelCopyWithImpl<_ThreadListResponseModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ThreadListResponseModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ThreadListResponseModel&&const DeepCollectionEquality().equals(other.threads, threads)&&(identical(other.nextCursor, nextCursor) || other.nextCursor == nextCursor)&&(identical(other.totalCount, totalCount) || other.totalCount == totalCount));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(threads),nextCursor,totalCount);

@override
String toString() {
  return 'ThreadListResponseModel(threads: $threads, nextCursor: $nextCursor, totalCount: $totalCount)';
}


}

/// @nodoc
abstract mixin class _$ThreadListResponseModelCopyWith<$Res> implements $ThreadListResponseModelCopyWith<$Res> {
  factory _$ThreadListResponseModelCopyWith(_ThreadListResponseModel value, $Res Function(_ThreadListResponseModel) _then) = __$ThreadListResponseModelCopyWithImpl;
@override @useResult
$Res call({
 List<ThreadModel> threads, String? nextCursor, int totalCount
});




}
/// @nodoc
class __$ThreadListResponseModelCopyWithImpl<$Res>
    implements _$ThreadListResponseModelCopyWith<$Res> {
  __$ThreadListResponseModelCopyWithImpl(this._self, this._then);

  final _ThreadListResponseModel _self;
  final $Res Function(_ThreadListResponseModel) _then;

/// Create a copy of ThreadListResponseModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? threads = null,Object? nextCursor = freezed,Object? totalCount = null,}) {
  return _then(_ThreadListResponseModel(
threads: null == threads ? _self.threads : threads // ignore: cast_nullable_to_non_nullable
as List<ThreadModel>,nextCursor: freezed == nextCursor ? _self.nextCursor : nextCursor // ignore: cast_nullable_to_non_nullable
as String?,totalCount: null == totalCount ? _self.totalCount : totalCount // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}


/// @nodoc
mixin _$ThreadDetailModel {

 ThreadModel get thread; List<MessageModel> get messages;
/// Create a copy of ThreadDetailModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ThreadDetailModelCopyWith<ThreadDetailModel> get copyWith => _$ThreadDetailModelCopyWithImpl<ThreadDetailModel>(this as ThreadDetailModel, _$identity);

  /// Serializes this ThreadDetailModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ThreadDetailModel&&(identical(other.thread, thread) || other.thread == thread)&&const DeepCollectionEquality().equals(other.messages, messages));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,thread,const DeepCollectionEquality().hash(messages));

@override
String toString() {
  return 'ThreadDetailModel(thread: $thread, messages: $messages)';
}


}

/// @nodoc
abstract mixin class $ThreadDetailModelCopyWith<$Res>  {
  factory $ThreadDetailModelCopyWith(ThreadDetailModel value, $Res Function(ThreadDetailModel) _then) = _$ThreadDetailModelCopyWithImpl;
@useResult
$Res call({
 ThreadModel thread, List<MessageModel> messages
});


$ThreadModelCopyWith<$Res> get thread;

}
/// @nodoc
class _$ThreadDetailModelCopyWithImpl<$Res>
    implements $ThreadDetailModelCopyWith<$Res> {
  _$ThreadDetailModelCopyWithImpl(this._self, this._then);

  final ThreadDetailModel _self;
  final $Res Function(ThreadDetailModel) _then;

/// Create a copy of ThreadDetailModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? thread = null,Object? messages = null,}) {
  return _then(_self.copyWith(
thread: null == thread ? _self.thread : thread // ignore: cast_nullable_to_non_nullable
as ThreadModel,messages: null == messages ? _self.messages : messages // ignore: cast_nullable_to_non_nullable
as List<MessageModel>,
  ));
}
/// Create a copy of ThreadDetailModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ThreadModelCopyWith<$Res> get thread {
  
  return $ThreadModelCopyWith<$Res>(_self.thread, (value) {
    return _then(_self.copyWith(thread: value));
  });
}
}


/// Adds pattern-matching-related methods to [ThreadDetailModel].
extension ThreadDetailModelPatterns on ThreadDetailModel {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ThreadDetailModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ThreadDetailModel() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ThreadDetailModel value)  $default,){
final _that = this;
switch (_that) {
case _ThreadDetailModel():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ThreadDetailModel value)?  $default,){
final _that = this;
switch (_that) {
case _ThreadDetailModel() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( ThreadModel thread,  List<MessageModel> messages)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ThreadDetailModel() when $default != null:
return $default(_that.thread,_that.messages);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( ThreadModel thread,  List<MessageModel> messages)  $default,) {final _that = this;
switch (_that) {
case _ThreadDetailModel():
return $default(_that.thread,_that.messages);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( ThreadModel thread,  List<MessageModel> messages)?  $default,) {final _that = this;
switch (_that) {
case _ThreadDetailModel() when $default != null:
return $default(_that.thread,_that.messages);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ThreadDetailModel implements ThreadDetailModel {
  const _ThreadDetailModel({required this.thread, required this.messages});
  factory _ThreadDetailModel.fromJson(Map<String, dynamic> json) => _$ThreadDetailModelFromJson(json);

@override final  ThreadModel thread;
@override final  List<MessageModel> messages;

/// Create a copy of ThreadDetailModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ThreadDetailModelCopyWith<_ThreadDetailModel> get copyWith => __$ThreadDetailModelCopyWithImpl<_ThreadDetailModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ThreadDetailModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ThreadDetailModel&&(identical(other.thread, thread) || other.thread == thread)&&const DeepCollectionEquality().equals(other.messages, messages));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,thread,const DeepCollectionEquality().hash(messages));

@override
String toString() {
  return 'ThreadDetailModel(thread: $thread, messages: $messages)';
}


}

/// @nodoc
abstract mixin class _$ThreadDetailModelCopyWith<$Res> implements $ThreadDetailModelCopyWith<$Res> {
  factory _$ThreadDetailModelCopyWith(_ThreadDetailModel value, $Res Function(_ThreadDetailModel) _then) = __$ThreadDetailModelCopyWithImpl;
@override @useResult
$Res call({
 ThreadModel thread, List<MessageModel> messages
});


@override $ThreadModelCopyWith<$Res> get thread;

}
/// @nodoc
class __$ThreadDetailModelCopyWithImpl<$Res>
    implements _$ThreadDetailModelCopyWith<$Res> {
  __$ThreadDetailModelCopyWithImpl(this._self, this._then);

  final _ThreadDetailModel _self;
  final $Res Function(_ThreadDetailModel) _then;

/// Create a copy of ThreadDetailModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? thread = null,Object? messages = null,}) {
  return _then(_ThreadDetailModel(
thread: null == thread ? _self.thread : thread // ignore: cast_nullable_to_non_nullable
as ThreadModel,messages: null == messages ? _self.messages : messages // ignore: cast_nullable_to_non_nullable
as List<MessageModel>,
  ));
}

/// Create a copy of ThreadDetailModel
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ThreadModelCopyWith<$Res> get thread {
  
  return $ThreadModelCopyWith<$Res>(_self.thread, (value) {
    return _then(_self.copyWith(thread: value));
  });
}
}

// dart format on
